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
import { useState, useMemo, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useWorkflow } from "@/contexts/WorkflowContext";
import { useProjectWorkflow } from "@/hooks/useProjectWorkflow";
import { UndoRedoProvider, useUndoRedo, UndoableAction } from "@/contexts/UndoRedoContext";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

const API_URL = import.meta.env.VITE_API_URL || "/api";

const priorityColors: Record<Priority, string> = {
  Low: "bg-priority-low text-white",
  Medium: "bg-priority-medium text-white",
  High: "bg-priority-high text-white",
  Critical: "bg-red-900 text-white",
};

// Inner component - contains all UI and logic
const ProjectDetailInner = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { getProjectById } = useApp();
  const project = getProjectById(id!);
  const { logActivity, getProjectLogs } = useActivityLog(project?.id);
  const { addComment, deleteComment, getProjectComments } = useComments(project?.id);
  const { getProjectTotalTime } = useWorklog();
  const queryClient = useQueryClient();
  const { taskStatuses, addTaskStatus, deleteTaskStatus, updateTaskStatus } = useProjectWorkflow(project?.id);
  const { addAction } = useUndoRedo();
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isTaskDetailModalOpen, setIsTaskDetailModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  const [viewingTask, setViewingTask] = useState<Task | null>(null);
  const [defaultTaskStatus, setDefaultTaskStatus] = useState<string | undefined>(undefined);
  const [showActivityLog, setShowActivityLog] = useState(false);
  const [showTimeSpent, setShowTimeSpent] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showAddStatusDialog, setShowAddStatusDialog] = useState(false);
  const [newStatusName, setNewStatusName] = useState("");
  const [newStatusColor, setNewStatusColor] = useState("bg-blue-500");
  const [addStatusPosition, setAddStatusPosition] = useState<'start' | 'end'>('end');

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

    // Save before state for undo
    const beforeState: Partial<Task> = {};
    Object.keys(updates).forEach(key => {
      beforeState[key as keyof Task] = task[key as keyof Task];
    });

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

      // Add to undo history (include all updates)
      if (!skipActivityLog) {
        addAction({
          type: 'TASK_UPDATE',
          taskId,
          projectId: project.id,
          before: beforeState,
          after: updates
        });
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

      // Add to undo history
      addAction({
        type: 'TASK_DELETE',
        task: { ...task },
        projectId: project.id
      });

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
  const handleAddStatus = async () => {
    if (!newStatusName.trim()) return;

    try {
      // Calculate order based on position
      let order = 0;
      if (addStatusPosition === 'end') {
        // Add to end - find max order and add 1
        order = taskStatuses.length > 0
          ? Math.max(...taskStatuses.map(s => s.order)) + 1
          : 0;
      } else {
        // Add to start - order = 0 (all others will be pushed right by backend)
        order = 0;
      }

      await addTaskStatus(newStatusName.trim(), newStatusColor, order);

      toast.success("Status added");
      setShowAddStatusDialog(false);
      setNewStatusName("");
      setNewStatusColor("bg-blue-500");
    } catch (error: any) {
      console.error("Error adding status:", error);
      toast.error(error?.message || "Failed to add status");
    }
  };

  const handleEditStatus = async (statusId: string, newName: string, newColor: string) => {
    try {
      console.log("🔄 Updating status:", { statusId, newName, newColor });

      // Find current status for undo
      const currentStatus = taskStatuses.find(s => s.id === statusId);
      console.log("📋 Current status before update:", currentStatus);

      const before = currentStatus ? { name: currentStatus.name, color: currentStatus.color } : { name: '', color: '' };

      await updateTaskStatus(statusId, { name: newName, color: newColor });

      // Add to undo history
      addAction({
        type: 'STATUS_UPDATE',
        statusId,
        statusName: before.name, // Store original name for finding status after undo/redo
        before,
        after: { name: newName, color: newColor }
      });

      console.log("✅ Status updated successfully");
      toast.success("Status updated");
    } catch (error: any) {
      console.error("❌ Error updating status:", error);
      console.error("Error details:", error.response?.data);
      toast.error(error?.message || "Failed to update status");
    }
  };

  const handleQuickCreateTask = async (status: string, title: string, description?: string) => {
    if (!project) return;

    try {
      const newTask = await createTaskMutation.mutateAsync({
        projectId: project.id,
        title: title,
        description: description || "",
        status: status,
        assignee: "",
        priority: "Medium",
        deadline: undefined,
        followUp: false,
      });

      // Log activity
      logActivity(
        project.id,
        "task_created",
        `Task "${newTask.title}" created`,
        { taskId: newTask.id }
      );

      // Add to undo history
      addAction({
        type: 'TASK_CREATE',
        task: newTask,
        projectId: project.id
      });

      toast.success("Task created");
    } catch (error: any) {
      console.error("❌ Task creation failed:", error);
      console.error("Error response:", error.response);
      console.error("Error data:", error.response?.data);
      console.error("Project ID being sent:", project?.id);
      toast.error(error.response?.data?.error || "Failed to create task");
    }
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

        // Add to undo history
        addAction({
          type: 'TASK_CREATE',
          task: newTask,
          projectId: project.id
        });

        toast.success("Task created");
        setIsTaskModalOpen(false);
      } catch (error) {
        toast.error("Failed to create task");
      }
    }
  };

  if (!project) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Project not found</p>
      </div>
    );
  }

  const deadlineStatus = getDeadlineStatus(project.deadline);
  const needsFollowUp = hasFollowUpNeeded(project.tasks);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <div className="flex-1 min-h-0 px-6 pt-4 pb-6 overflow-hidden">
          <TaskKanban
            projectId={project.id}
            tasks={project.tasks}
            statuses={taskStatuses}
            onUpdateTask={handleUpdateTask}
            onEditTask={(task) => {
              setEditingTask(task);
              setIsTaskModalOpen(true);
            }}
            onReorderTasks={(taskOrders) => {
              if (project) {
                // Capture previous state for undo
                const previousOrders = taskOrders.map(order => {
                  const task = project.tasks.find(t => t.id === order.id);
                  return {
                    id: order.id,
                    order: task?.order ?? 0,
                    status: task?.status ?? order.status
                  };
                });

                reorderTasksMutation.mutate({ projectId: project.id, taskOrders });

                // Add to undo history
                addAction({
                  type: 'TASK_REORDER',
                  projectId: project.id,
                  taskOrders,
                  previousOrders
                });
              }
            }}
            onDeleteTask={handleDeleteTask}
            onViewTaskDetails={(task) => {
              setViewingTask(task);
              setIsTaskDetailModalOpen(true);
            }}
            onCreateTask={handleCreateTask}
            onQuickCreateTask={handleQuickCreateTask}
            onAddStatus={(position) => {
              setAddStatusPosition(position || 'end');
              setShowAddStatusDialog(true);
            }}
            onDeleteStatus={async (statusId: string) => {
              try {
                // Find status for undo
                const status = taskStatuses.find(s => s.id === statusId);

                await deleteTaskStatus(statusId);

                // Add to undo history
                if (status) {
                  addAction({
                    type: 'STATUS_DELETE',
                    status: {
                      id: status.id,
                      name: status.name,
                      color: status.color,
                      order: status.order ?? 0
                    }
                  });
                }

                toast.success("Status deleted");
              } catch (error: any) {
                toast.error(error.message || "Failed to delete status");
              }
            }}
            onEditStatus={handleEditStatus}
          />
        </div>
      </div>

      {/* Floating Activity Log Panel */}
      {showActivityLog && (
        <div className="fixed bottom-4 left-4 z-50 w-[90vw] sm:w-96 max-h-[70vh] bg-background border border-border rounded-lg shadow-2xl flex flex-col">
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
            left: showActivityLog ? '420px' : '16px',
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
            {(() => {
              // Collect all worklogs from all tasks
              const allWorklogs = project.tasks.flatMap(task => {
                const taskWorklogs = task.worklog || [];
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
                      .sort(([, a], [, b]) => {
                        // Sort by total time (descending - max time first)
                        const aTime = a.logs.reduce((sum, log) => sum + (log.durationMs || 0), 0);
                        const bTime = b.logs.reduce((sum, log) => sum + (log.durationMs || 0), 0);
                        return bTime - aTime;
                      })
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
                                <div key={`${taskId} - ${user}`} className="pl-2 text-xs text-muted-foreground flex items-center justify-between">
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
      )}

      {/* Floating Comments Panel */}
      {showComments && (
        <div
          className="fixed bottom-4 z-50 w-[90vw] sm:w-96 max-h-[70vh] bg-background border border-border rounded-lg shadow-2xl flex flex-col"
          style={{
            left: `${16 + (showActivityLog ? 420 : 0) + (showTimeSpent ? 420 : 0)}px`,
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

      {/* Floating Action Buttons - Single Compact Bar */}
      <div className="fixed bottom-4 left-4 z-40">
        <div className="flex items-center gap-1 bg-card border-2 border-primary/20 rounded-lg shadow-xl p-1.5 backdrop-blur-sm">
          {!showActivityLog && (
            <Button
              onClick={() => setShowActivityLog(true)}
              className="rounded-md h-10 w-10 p-0 bg-primary hover:bg-primary/90 text-primary-foreground shadow-md transition-all"
              size="sm"
              title="Activity Log"
            >
              <Activity className="h-5 w-5" />
            </Button>
          )}
          {!showTimeSpent && (
            <Button
              onClick={() => setShowTimeSpent(true)}
              className="rounded-md h-10 w-10 p-0 bg-primary hover:bg-primary/90 text-primary-foreground shadow-md transition-all"
              size="sm"
              title="Time Spent"
            >
              <Clock className="h-5 w-5" />
            </Button>
          )}
          {!showComments && (
            <Button
              onClick={() => setShowComments(true)}
              className="rounded-md h-10 w-10 p-0 bg-primary hover:bg-primary/90 text-primary-foreground shadow-md transition-all"
              size="sm"
              title="Comments"
            >
              <MessageSquare className="h-5 w-5" />
            </Button>
          )}
        </div>
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

      {/* Add Status Dialog */}
      <Dialog open={showAddStatusDialog} onOpenChange={setShowAddStatusDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Status</DialogTitle>
            <DialogDescription>
              Create a new task status column for this project.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Status Name</Label>
              <Input
                value={newStatusName}
                onChange={(e) => setNewStatusName(e.target.value)}
                placeholder="e.g., Review, Blocked"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newStatusName.trim()) {
                    handleAddStatus();
                  }
                }}
              />
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex gap-2 flex-wrap">
                {[
                  "bg-blue-500",
                  "bg-green-500",
                  "bg-yellow-500",
                  "bg-orange-500",
                  "bg-red-500",
                  "bg-purple-500",
                  "bg-pink-500",
                  "bg-indigo-500",
                ].map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setNewStatusColor(color)}
                    className={cn(
                      "w-8 h-8 rounded-full border-2 transition-all",
                      color,
                      newStatusColor === color ? "border-foreground scale-110" : "border-transparent"
                    )}
                  />
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => {
                setShowAddStatusDialog(false);
                setNewStatusName("");
                setNewStatusColor("bg-blue-500");
              }}>
                Cancel
              </Button>
              <Button
                onClick={handleAddStatus}
                disabled={!newStatusName.trim()}
              >
                Add Status
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Wrapper component with UndoRedoProvider and undo/redo logic
const ProjectDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { getProjectById } = useApp();
  const project = getProjectById(id!);
  const { taskStatuses, addTaskStatus, deleteTaskStatus, updateTaskStatus } = useProjectWorkflow(project?.id);
  const queryClient = useQueryClient();

  // Undo handler
  const handleUndo = useCallback(async (action: UndoableAction) => {
    const API_URL = import.meta.env.VITE_API_URL || "/api";

    switch (action.type) {
      case 'TASK_CREATE':
        await fetch(`${API_URL}/tasks/${action.task.id}`, { method: "DELETE" });
        queryClient.invalidateQueries({ queryKey: ["projects"] });
        toast.success("Undone: Task creation");
        break;

      case 'TASK_UPDATE':
        await fetch(`${API_URL}/tasks/${action.taskId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(action.before),
        });
        queryClient.invalidateQueries({ queryKey: ["projects"] });
        toast.success("Undone: Task update");
        break;

      case 'TASK_DELETE':
        await fetch(`${API_URL}/tasks`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...action.task, projectId: action.projectId }),
        });
        queryClient.invalidateQueries({ queryKey: ["projects"] });
        toast.success("Undone: Task deletion");
        break;

      case 'STATUS_CREATE':
        await deleteTaskStatus(action.status.id);
        queryClient.invalidateQueries({ queryKey: ["workflow"] });
        toast.success("Undone: Status creation");
        break;

      case 'STATUS_UPDATE':
        const statusToUndo = taskStatuses.find(s => s.name === action.after.name) ||
          taskStatuses.find(s => s.id === action.statusId);
        if (statusToUndo) {
          await updateTaskStatus(statusToUndo.id, action.before);
          queryClient.invalidateQueries({ queryKey: ["workflow"] });
          toast.success("Undone: Status update");
        }
        break;

      case 'STATUS_DELETE':
        await addTaskStatus(action.status.name, action.status.color, action.status.order);
        queryClient.invalidateQueries({ queryKey: ["workflow"] });
        toast.success("Undone: Status deletion");
        break;

      case 'TASK_REORDER':
        // Revert to old orders
        await Promise.all(action.previousOrders.map(order =>
          fetch(`${API_URL}/tasks/${order.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ order: order.order, status: order.status }),
          })
        ));
        queryClient.invalidateQueries({ queryKey: ["projects"] });
        toast.success("Undone: Task reorder");
        break;
    }
  }, [queryClient, taskStatuses, deleteTaskStatus, updateTaskStatus, addTaskStatus]);

  // Redo handler
  const handleRedo = useCallback(async (action: UndoableAction) => {
    const API_URL = import.meta.env.VITE_API_URL || "/api";

    switch (action.type) {
      case 'TASK_CREATE':
        await fetch(`${API_URL}/tasks`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...action.task, projectId: action.projectId }),
        });
        queryClient.invalidateQueries({ queryKey: ["projects"] });
        toast.success("Redone: Task creation");
        break;

      case 'TASK_UPDATE':
        await fetch(`${API_URL}/tasks/${action.taskId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(action.after),
        });
        queryClient.invalidateQueries({ queryKey: ["projects"] });
        toast.success("Redone: Task update");
        break;

      case 'TASK_DELETE':
        await fetch(`${API_URL}/tasks/${action.task.id}`, { method: "DELETE" });
        queryClient.invalidateQueries({ queryKey: ["projects"] });
        toast.success("Redone: Task deletion");
        break;

      case 'STATUS_CREATE':
        await addTaskStatus(action.status.name, action.status.color, action.status.order);
        queryClient.invalidateQueries({ queryKey: ["workflow"] });
        toast.success("Redone: Status creation");
        break;

      case 'STATUS_UPDATE':
        const statusToRedo = taskStatuses.find(s => s.name === action.before.name) ||
          taskStatuses.find(s => s.id === action.statusId);
        if (statusToRedo) {
          await updateTaskStatus(statusToRedo.id, action.after);
          queryClient.invalidateQueries({ queryKey: ["workflow"] });
          toast.success("Redone: Status update");
        }
        break;

      case 'STATUS_DELETE':
        const statusToDelete = taskStatuses.find(s => s.name === action.status.name);
        if (statusToDelete) {
          await deleteTaskStatus(statusToDelete.id);
          queryClient.invalidateQueries({ queryKey: ["workflow"] });
          toast.success("Redone: Status deletion");
        }
        break;

      case 'TASK_REORDER':
        // Apply new orders
        await Promise.all(action.taskOrders.map(order =>
          fetch(`${API_URL}/tasks/${order.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ order: order.order, status: order.status }),
          })
        ));
        queryClient.invalidateQueries({ queryKey: ["projects"] });
        toast.success("Redone: Task reorder");
        break;
    }
  }, [queryClient, taskStatuses, addTaskStatus, deleteTaskStatus, updateTaskStatus]);

  return (
    <UndoRedoProvider onUndo={handleUndo} onRedo={handleRedo}>
      <ProjectDetailInner />
    </UndoRedoProvider>
  );
};

export default ProjectDetail;
