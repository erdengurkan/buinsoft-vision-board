import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useApp } from "@/contexts/AppContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, User, AlertCircle, Plus, ChevronUp, ChevronDown, Info, Clock, MessageSquare, Activity } from "lucide-react";
import { TaskKanban } from "@/components/kanban/TaskKanban";
import { TaskFormModal } from "@/components/modals/TaskFormModal";
import { TaskDetailModal } from "@/components/modals/TaskDetailModal";
import { ActivityTimeline } from "@/components/activity/ActivityTimeline";
import { Comments } from "@/components/comments/Comments";
import { cn } from "@/lib/utils";
import { Priority, Task } from "@/types";
import { getDeadlineStatus, hasFollowUpNeeded } from "@/utils/deadlineHelpers";
import { useActivityLog } from "@/hooks/useActivityLog";
import { useComments } from "@/hooks/useComments";
import { useWorklog } from "@/hooks/useWorklog";
import { toast } from "sonner";
import { useState, useMemo, useEffect } from "react";
import { format } from "date-fns";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const API_URL = import.meta.env.VITE_API_URL || "/api";

const priorityColors: Record<Priority, string> = {
  Low: "bg-priority-low text-white",
  Medium: "bg-priority-medium text-white",
  High: "bg-priority-high text-white",
  Critical: "bg-red-900 text-white",
};

const ProjectDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { getProjectById } = useApp();
  const project = getProjectById(id!);
  const { logActivity, getProjectLogs } = useActivityLog(project?.id);
  const { addComment, deleteComment, getProjectComments } = useComments(project?.id);
  const { getProjectTotalTime } = useWorklog();
  const queryClient = useQueryClient();
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isTaskDetailModalOpen, setIsTaskDetailModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  const [viewingTask, setViewingTask] = useState<Task | null>(null);
  const [defaultTaskStatus, setDefaultTaskStatus] = useState<string | undefined>(undefined);
  const [showActivityLog, setShowActivityLog] = useState(false);
  const [showTimeSpent, setShowTimeSpent] = useState(false);
  const [showComments, setShowComments] = useState(false);

  // Task mutations - MUST be before conditional returns (Rules of Hooks)
  const updateTaskMutation = useMutation({
    mutationFn: async ({ taskId, updates }: { taskId: string; updates: Partial<Task> }) => {
      const res = await fetch(`${API_URL}/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error("Failed to update task");
      return res.json();
    },
    onSuccess: (data, variables) => {
      // Update with server response to ensure consistency
      // CRITICAL: Merge server response to preserve all fields
      if (project) {
        queryClient.setQueryData(["projects"], (oldData: any) => {
          if (!oldData) return oldData;
          return oldData.map((p: any) => {
            if (p.id === project.id) {
              return {
                ...p,
                tasks: p.tasks.map((t: any) => {
                  if (t.id === variables.taskId) {
                    // Merge server response with existing task to preserve all fields
                    // This ensures status and other fields aren't lost
                    return { ...t, ...data };
                  }
                  return t;
                }),
              };
            }
            return p;
          });
        });
      }
      
      // Invalidate after a delay to catch any SSE updates
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["projects"] });
      }, 500);
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: async (taskData: Partial<Task> & { projectId: string }) => {
      const res = await fetch(`${API_URL}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(taskData),
      });
      if (!res.ok) throw new Error("Failed to create task");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const res = await fetch(`${API_URL}/tasks/${taskId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete task");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });

  const reorderTasksMutation = useMutation({
    mutationFn: async ({ projectId, taskOrders }: { projectId: string; taskOrders: Array<{ id: string; order: number }> }) => {
      const res = await fetch(`${API_URL}/tasks/reorder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, taskOrders }),
      });
      if (!res.ok) throw new Error("Failed to reorder tasks");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });

  // Check if taskId is in URL query params and open task modal
  useEffect(() => {
    const taskId = searchParams.get("taskId");
    if (taskId && project) {
      const task = project.tasks.find((t) => t.id === taskId);
      if (task) {
        setViewingTask(task);
        setIsTaskDetailModalOpen(true);
        // Remove taskId from URL after opening modal
        setSearchParams({});
      }
    }
  }, [searchParams, project, setSearchParams]);
  
  const activityLogs = project ? getProjectLogs(project.id) : [];
  const projectComments = project ? getProjectComments(project.id) : [];
  const projectTotalTime = useMemo(() => {
    if (!project) return 0;
    const taskIds = project.tasks.map((t) => t.id);
    return getProjectTotalTime(taskIds);
  }, [project, getProjectTotalTime]);

  if (!project) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Project not found
          </h2>
          <Button onClick={() => navigate("/dashboard")}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const handleUpdateTask = async (taskId: string, updates: Partial<Task>, skipActivityLog = false) => {
    if (!project) return;
    
    const task = project.tasks.find((t) => t.id === taskId);
    if (!task) return;

    try {
      // Optimistic update for better UX (especially for drag-drop)
      // CRITICAL: Always preserve status if not explicitly being changed
      queryClient.setQueryData(["projects"], (oldData: any) => {
        if (!oldData) return oldData;
        return oldData.map((p: any) => {
          if (p.id === project.id) {
            return {
              ...p,
              tasks: p.tasks.map((t: any) => {
                if (t.id === taskId) {
                  // Merge updates with existing task data
                  const merged = { ...t, ...updates };
                  // CRITICAL: If status is not in updates, preserve existing status
                  if (!updates.hasOwnProperty('status') && t.status) {
                    merged.status = t.status;
                  }
                  return merged;
                }
                return t;
              }),
            };
          }
          return p;
        });
      });

      await updateTaskMutation.mutateAsync({ taskId, updates });

      // Log activity only if not skipped (skip for drag-drop reordering)
      if (!skipActivityLog) {
        if (updates.status && updates.status !== task.status) {
          logActivity(
            project.id,
            "task_status_changed",
            `Task "${task.title}" status changed`,
            {
              taskId,
              oldStatus: task.status,
              newStatus: updates.status,
            }
          );
        } else if (updates.followUp !== undefined && updates.followUp !== task.followUp) {
          logActivity(
            project.id,
            "follow_up_toggled",
            `Follow-up ${updates.followUp ? "enabled" : "disabled"} for task "${task.title}"`,
            { taskId, followUp: updates.followUp }
          );
        } else if (updates.deadline && updates.deadline.getTime() !== task.deadline?.getTime()) {
          logActivity(
            project.id,
            "deadline_updated",
            `Deadline updated for task "${task.title}"`,
            {
              taskId,
              oldValue: task.deadline ? format(task.deadline, "MMM d, yyyy") : "None",
              newValue: format(updates.deadline, "MMM d, yyyy"),
            }
          );
        } else if (Object.keys(updates).length > 0 && !updates.order) {
          // Only log if there are actual changes (not just order updates)
          logActivity(
            project.id,
            "task_edited",
            `Task "${task.title}" updated`,
            { taskId }
          );
        }
      }

      // Only show toast for non-order updates
      if (!skipActivityLog && !updates.order) {
        toast.success("Task updated");
      }
    } catch (error) {
      toast.error("Failed to update task");
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!project) return;
    
    const task = project.tasks.find((t) => t.id === taskId);
    if (!task) return;

    try {
      await deleteTaskMutation.mutateAsync(taskId);

      // Log activity
      logActivity(
        project.id,
        "task_deleted",
        `Task "${task.title}" deleted`,
        { taskId }
      );

      toast.success("Task deleted");
    } catch (error) {
      toast.error("Failed to delete task");
    }
  };

  const handleCreateTask = (status?: string) => {
    setEditingTask(undefined);
    setDefaultTaskStatus(status);
    setIsTaskModalOpen(true);
  };

  const handleSaveTask = async (taskData: Partial<Task>) => {
    if (!project) return;

    if (editingTask) {
      await handleUpdateTask(editingTask.id, taskData);
    } else {
      try {
        const newTask = await createTaskMutation.mutateAsync({
          projectId: project.id,
          title: taskData.title || "",
          description: taskData.description || "",
          status: taskData.status || "Todo",
          assignee: taskData.assignee || "",
          priority: taskData.priority || "Medium",
          deadline: taskData.deadline,
          followUp: taskData.followUp || false,
        });

        // Log activity
        logActivity(
          project.id,
          "task_created",
          `Task "${newTask.title}" created`,
          { taskId: newTask.id }
        );

        toast.success("Task created");
        setIsTaskModalOpen(false);
      } catch (error) {
        toast.error("Failed to create task");
      }
    }
  };

  const deadlineStatus = getDeadlineStatus(project.deadline);
  const needsFollowUp = hasFollowUpNeeded(project.tasks);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Compact Header - Single Line */}
      <div className="flex items-center justify-between gap-3 shrink-0 px-6 pt-6 pb-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/dashboard")}
          className="shrink-0"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <h1 className="text-xl font-bold text-foreground truncate">
            {project.title}
          </h1>
          <span className="text-muted-foreground">•</span>
          <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
            <User className="h-3 w-3" />
            <span className="truncate">{project.assignee}</span>
          </div>
          <span className="text-muted-foreground">•</span>
          <span className="text-xs text-muted-foreground truncate">{project.client}</span>
          <span className="text-muted-foreground">•</span>
          <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
            <Calendar className="h-3 w-3" />
            <span className="truncate">
              {format(project.startDate, "MMM d")} - {format(project.endDate, "MMM d")}
            </span>
          </div>
          {project.deadline && (
            <>
              <span className="text-muted-foreground">•</span>
              <div className={cn(
                "flex items-center gap-1 text-xs font-medium shrink-0",
                deadlineStatus === "overdue" ? "text-red-600 dark:text-red-400" :
                  deadlineStatus === "soon" ? "text-orange-600 dark:text-orange-400" :
                    "text-muted-foreground"
              )}>
                <Calendar className="h-3 w-3" />
                <span>{format(project.deadline, "MMM d")}</span>
              </div>
            </>
          )}
          {needsFollowUp && (
            <>
              <span className="text-muted-foreground">•</span>
              <div className="flex items-center gap-1 text-xs text-orange-600 dark:text-orange-400 font-medium shrink-0">
                <AlertCircle className="h-3 w-3" />
                <span>Follow-up</span>
              </div>
            </>
          )}
          {project.labels.length > 0 && (
            <>
              <span className="text-muted-foreground">•</span>
              <div className="flex items-center gap-1 shrink-0">
                {project.labels.slice(0, 2).map((label) => (
                  <Badge
                    key={label.id}
                    variant="secondary"
                    className={cn("text-xs px-1.5 py-0", label.color, "text-white")}
                  >
                    {label.name}
                  </Badge>
                ))}
                {project.labels.length > 2 && (
                  <span className="text-xs text-muted-foreground">+{project.labels.length - 2}</span>
                )}
              </div>
            </>
          )}
        </div>
        
        <div className="flex items-center gap-2 shrink-0">
          <Badge className={cn("text-xs px-2 py-0", priorityColors[project.priority])}>
            {project.priority}
          </Badge>
          <Badge variant="outline" className="text-xs px-2 py-0">
            {project.status}
          </Badge>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <div className="flex items-center justify-between mb-3 px-6 shrink-0">
          <h2 className="text-lg font-semibold text-foreground">Tasks</h2>
          <Button size="sm" onClick={() => handleCreateTask()}>
            <Plus className="h-4 w-4 mr-1" />
            New Task
          </Button>
        </div>
        <div className="flex-1 min-h-0 px-6 pb-6 overflow-hidden">
        {project.tasks.length > 0 ? (
          <TaskKanban
            projectId={project.id}
            tasks={project.tasks}
            onUpdateTask={handleUpdateTask}
            onReorderTasks={(taskOrders) => {
              if (project) {
                reorderTasksMutation.mutate({ projectId: project.id, taskOrders });
              }
            }}
            onDeleteTask={handleDeleteTask}
            onViewTaskDetails={(task) => {
              setViewingTask(task);
              setIsTaskDetailModalOpen(true);
            }}
            onCreateTask={handleCreateTask}
          />
        ) : (
          <div className="text-center py-12 bg-muted/30 rounded-lg">
            <p className="text-muted-foreground">
              No tasks yet for this project
            </p>
          </div>
        )}
        </div>
      </div>

      {/* Floating Activity Log Panel */}
      {showActivityLog && (
        <div className="fixed bottom-4 right-4 z-50 w-[90vw] sm:w-96 max-h-[70vh] bg-background border border-border rounded-lg shadow-2xl flex flex-col">
          <div className="flex items-center justify-between p-3 border-b border-border bg-muted/30">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Activity Log
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowActivityLog(false)}
              className="h-6 w-6 p-0"
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>
          <div className="overflow-y-auto flex-1 p-4">
            <ActivityTimeline logs={activityLogs} />
          </div>
        </div>
      )}

      {/* Floating Time Spent Panel */}
      {showTimeSpent && (
        <div 
          className="fixed bottom-4 z-50 w-[90vw] sm:w-96 max-h-[70vh] bg-background border border-border rounded-lg shadow-2xl flex flex-col" 
          style={{ 
            right: showActivityLog ? '420px' : '16px',
            maxWidth: 'calc(100vw - 32px)'
          }}
        >
          <div className="flex items-center justify-between p-3 border-b border-border bg-muted/30">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Time Spent
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowTimeSpent(false)}
              className="h-6 w-6 p-0"
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>
          <div className="overflow-y-auto flex-1 p-4">
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Time Spent</h3>
              {(() => {
                    // Collect all worklogs from all tasks
                    const allWorklogs = project.tasks.flatMap(task => {
                      const taskWorklogs = task.worklogs || [];
                      return taskWorklogs.map(log => ({ 
                        ...log, 
                        taskId: task.id, 
                        taskTitle: task.title,
                        durationMs: log.durationMs || 0,
                        user: log.user || "Unknown"
                      }));
                    });

                    if (allWorklogs.length === 0) {
                      return <p className="text-sm text-muted-foreground">No time tracked yet</p>;
                    }

                    // Calculate total project time
                    const totalTimeMs = allWorklogs.reduce((sum, log) => sum + (log.durationMs || 0), 0);
                    const totalTimeSeconds = Math.floor(totalTimeMs / 1000);
                    const totalHours = Math.floor(totalTimeSeconds / 3600);
                    const totalMinutes = Math.floor((totalTimeSeconds % 3600) / 60);

                    // Group by user (for user totals)
                    const byUser = allWorklogs.reduce((acc: Record<string, number>, log) => {
                      const user = log.user || "Unknown";
                      acc[user] = (acc[user] || 0) + (log.durationMs || 0);
                      return acc;
                    }, {});

                    // Group by task (for task breakdown)
                    const byTask = allWorklogs.reduce((acc: Record<string, { title: string; logs: typeof allWorklogs }>, log) => {
                      if (!acc[log.taskId]) {
                        acc[log.taskId] = { title: log.taskTitle || "Unknown Task", logs: [] };
                      }
                      acc[log.taskId].logs.push(log);
                      return acc;
                    }, {});

                    return (
                      <div className="space-y-3">
                        {/* Total Project Time */}
                        <div className="flex items-center justify-between pb-2 border-b">
                          <span className="text-sm text-muted-foreground">Total Project Time</span>
                          <span className="text-lg font-bold">
                            {totalHours}h {totalMinutes}m
                          </span>
                        </div>

                        {/* By User */}
                        <div className="space-y-2">
                          <h4 className="text-xs font-semibold text-muted-foreground uppercase">By User</h4>
                          {Object.entries(byUser)
                            .sort(([, a], [, b]) => b - a) // Sort by time descending
                            .map(([user, timeMs]) => {
                              const userTimeSeconds = Math.floor(timeMs / 1000);
                              const userHours = Math.floor(userTimeSeconds / 3600);
                              const userMinutes = Math.floor((userTimeSeconds % 3600) / 60);
                              return (
                                <div key={user} className="flex items-center justify-between text-xs">
                                  <span className="font-medium truncate">{user}</span>
                                  <span className="text-muted-foreground">
                                    {userHours}h {userMinutes}m
                                  </span>
                                </div>
                              );
                            })}
                        </div>

                        {/* By Task */}
                        <div className="space-y-2 max-h-48 overflow-y-auto border-t pt-2">
                          <h4 className="text-xs font-semibold text-muted-foreground uppercase mt-2">By Task</h4>
                          {Object.entries(byTask)
                            .map(([taskId, { title, logs }]) => {
                              const taskTimeMs = logs.reduce((sum, log) => sum + (log.durationMs || 0), 0);
                              const taskTimeSeconds = Math.floor(taskTimeMs / 1000);
                              const taskHours = Math.floor(taskTimeSeconds / 3600);
                              const taskMinutes = Math.floor((taskTimeSeconds % 3600) / 60);
                              
                              // Group by user within this task
                              const taskByUser = logs.reduce((acc: Record<string, number>, log) => {
                                const user = log.user || "Unknown";
                                acc[user] = (acc[user] || 0) + (log.durationMs || 0);
                                return acc;
                              }, {});

                              return (
                                <div key={taskId} className="text-sm space-y-1 mb-2">
                                  <div className="flex items-center justify-between font-medium">
                                    <span className="truncate">{title}</span>
                                    <span className="text-muted-foreground">
                                      {taskHours}h {taskMinutes}m
                                    </span>
                                  </div>
                                  {Object.entries(taskByUser).map(([user, timeMs]) => {
                                    const userTimeSeconds = Math.floor(timeMs / 1000);
                                    const userHours = Math.floor(userTimeSeconds / 3600);
                                    const userMinutes = Math.floor((userTimeSeconds % 3600) / 60);
                                    return (
                                      <div key={`${taskId}-${user}`} className="pl-2 text-xs text-muted-foreground flex items-center justify-between">
                                        <span className="truncate">{user}</span>
                                        <span>{userHours}h {userMinutes}m</span>
                                      </div>
                                    );
                                  })}
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    );
                  })()}
            </div>
          </div>
        </div>
      )}

      {/* Floating Comments Panel */}
      {showComments && (
        <div 
          className="fixed bottom-4 z-50 w-[90vw] sm:w-96 max-h-[70vh] bg-background border border-border rounded-lg shadow-2xl flex flex-col" 
          style={{ 
            right: `${16 + (showActivityLog ? 420 : 0) + (showTimeSpent ? 420 : 0)}px`,
            maxWidth: 'calc(100vw - 32px)'
          }}
        >
          <div className="flex items-center justify-between p-3 border-b border-border bg-muted/30">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Comments
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowComments(false)}
              className="h-6 w-6 p-0"
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>
          <div className="overflow-y-auto flex-1 p-4">
            <Comments
              projectId={project.id}
              comments={projectComments}
              onAddComment={(text) => {
                addComment(project.id, undefined, text);
              }}
              onDeleteComment={deleteComment}
              onTaskClick={(taskId) => {
                const task = project.tasks.find((t) => t.id === taskId);
                if (task) {
                  setViewingTask(task);
                  setIsTaskDetailModalOpen(true);
                }
              }}
            />
          </div>
        </div>
      )}

      {/* Floating Action Buttons */}
      <div className="fixed bottom-4 right-4 z-40 flex flex-col gap-2">
        {!showActivityLog && (
          <Button
            onClick={() => setShowActivityLog(true)}
            className="rounded-full shadow-lg h-12 w-12 p-0 bg-primary hover:bg-primary/90"
            size="lg"
            title="Activity Log"
          >
            <Activity className="h-5 w-5" />
          </Button>
        )}
        {!showTimeSpent && (
          <Button
            onClick={() => setShowTimeSpent(true)}
            className="rounded-full shadow-lg h-12 w-12 p-0 bg-primary hover:bg-primary/90"
            size="lg"
            title="Time Spent"
          >
            <Clock className="h-5 w-5" />
          </Button>
        )}
        {!showComments && (
          <Button
            onClick={() => setShowComments(true)}
            className="rounded-full shadow-lg h-12 w-12 p-0 bg-primary hover:bg-primary/90"
            size="lg"
            title="Comments"
          >
            <MessageSquare className="h-5 w-5" />
          </Button>
        )}
      </div>

      <TaskFormModal
        open={isTaskModalOpen}
        onOpenChange={(open) => {
          setIsTaskModalOpen(open);
          if (!open) {
            setDefaultTaskStatus(undefined);
          }
        }}
        task={editingTask}
        defaultStatus={defaultTaskStatus}
        onSave={handleSaveTask}
      />

      <TaskDetailModal
        open={isTaskDetailModalOpen}
        onOpenChange={setIsTaskDetailModalOpen}
        task={viewingTask}
        projectTitle={project.title}
      />
    </div>
  );
};

export default ProjectDetail;
