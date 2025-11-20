import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useApp } from "@/contexts/AppContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, User, AlertCircle, Plus } from "lucide-react";
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
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
      queryClient.setQueryData(["projects"], (oldData: any) => {
        if (!oldData) return oldData;
        return oldData.map((p: any) => {
          if (p.id === project.id) {
            return {
              ...p,
              tasks: p.tasks.map((t: any) =>
                t.id === taskId ? { ...t, ...updates } : t
              ),
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

  const handleCreateTask = () => {
    setEditingTask(undefined);
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
    <div className="space-y-6">
      <div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/dashboard")}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>

        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-foreground">
              {project.title}
            </h1>
            <div className="flex flex-wrap gap-2 items-center text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <User className="h-4 w-4" />
                <span>{project.assignee}</span>
              </div>
              <span>•</span>
              <span>{project.client}</span>
              <span>•</span>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>
                  {project.startDate.toLocaleDateString()} -{" "}
                  {project.endDate.toLocaleDateString()}
                </span>
              </div>
            </div>
            {project.deadline && (
              <div className={cn(
                "flex items-center gap-1 text-sm font-medium",
                deadlineStatus === "overdue" ? "text-red-600 dark:text-red-400" :
                  deadlineStatus === "soon" ? "text-orange-600 dark:text-orange-400" :
                    "text-muted-foreground"
              )}>
                <Calendar className="h-4 w-4" />
                <span>Deadline: {format(project.deadline, "MMM d, yyyy")}</span>
              </div>
            )}
            {needsFollowUp && (
              <div className="flex items-center gap-1 text-sm text-orange-600 dark:text-orange-400 font-medium">
                <AlertCircle className="h-4 w-4" />
                <span>Follow-up Required on Tasks</span>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Badge className={cn("text-sm", priorityColors[project.priority])}>
              {project.priority}
            </Badge>
            <Badge variant="outline" className="text-sm">
              {project.status}
            </Badge>
          </div>
        </div>

        <p className="text-muted-foreground mt-4">{project.description}</p>

        <div className="flex flex-wrap gap-2 mt-4">
          {project.labels.map((label) => (
            <Badge
              key={label.id}
              variant="secondary"
              className={cn("text-sm", label.color, "text-white")}
            >
              {label.name}
            </Badge>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-foreground">Tasks</h2>
          <Button onClick={handleCreateTask}>
            <Plus className="h-4 w-4 mr-2" />
            New Task
          </Button>
        </div>
        {project.tasks.length > 0 ? (
          <TaskKanban
            projectId={project.id}
            tasks={project.tasks}
            onUpdateTask={handleUpdateTask}
            onDeleteTask={handleDeleteTask}
            onViewTaskDetails={(task) => {
              setViewingTask(task);
              setIsTaskDetailModalOpen(true);
            }}
          />
        ) : (
          <div className="text-center py-12 bg-muted/30 rounded-lg">
            <p className="text-muted-foreground">
              No tasks yet for this project
            </p>
          </div>
        )}
      </div>

      {/* 3 Column Layout: Activity Log, Time Spent, Comments */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Activity Log Column */}
        <div className="md:col-span-1">
          <ActivityTimeline logs={activityLogs} />
        </div>

        {/* Time Spent Column */}
        <div className="md:col-span-1">
          <div className="p-4 rounded-lg border border-border bg-card">
            <h3 className="text-lg font-semibold mb-2">Time Spent</h3>
            {projectTotalTime > 0 ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b">
                  <span className="text-sm text-muted-foreground">Total Project Time</span>
                  <span className="text-lg font-bold">
                    {Math.floor(projectTotalTime / 3600)}h {Math.floor((projectTotalTime % 3600) / 60)}m
                  </span>
                </div>
                
                {/* Task-level breakdown */}
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase">By Task</h4>
                  {project.tasks
                    .filter((task) => {
                      const taskTime = task.worklogs?.reduce((sum, log) => sum + log.durationMs, 0) || 0;
                      return taskTime > 0;
                    })
                    .map((task) => {
                      const taskTime = task.worklogs?.reduce((sum, log) => sum + log.durationMs, 0) || 0;
                      const taskTimeSeconds = Math.floor(taskTime / 1000);
                      const hours = Math.floor(taskTimeSeconds / 3600);
                      const minutes = Math.floor((taskTimeSeconds % 3600) / 60);
                      
                      // Group by user
                      const byUser = task.worklogs?.reduce((acc: Record<string, number>, log) => {
                        acc[log.user] = (acc[log.user] || 0) + log.durationMs;
                        return acc;
                      }, {}) || {};

                      return (
                        <div key={task.id} className="text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-medium truncate">{task.title}</span>
                            <span className="text-muted-foreground">
                              {hours}h {minutes}m
                            </span>
                          </div>
                          {Object.entries(byUser).map(([user, timeMs]) => {
                            const userTimeSeconds = Math.floor(timeMs / 1000);
                            const userHours = Math.floor(userTimeSeconds / 3600);
                            const userMinutes = Math.floor((userTimeSeconds % 3600) / 60);
                            return (
                              <div key={user} className="pl-2 text-muted-foreground flex items-center justify-between">
                                <span className="truncate">{user}</span>
                                <span>{userHours}h {userMinutes}m</span>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  {project.tasks.filter((task) => {
                    const taskTime = task.worklogs?.reduce((sum, log) => sum + log.durationMs, 0) || 0;
                    return taskTime > 0;
                  }).length === 0 && (
                    <p className="text-xs text-muted-foreground">No task time tracked yet</p>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No time tracked yet</p>
            )}
          </div>
        </div>

        {/* Comments Column */}
        <div className="md:col-span-1">
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

      <TaskFormModal
        open={isTaskModalOpen}
        onOpenChange={setIsTaskModalOpen}
        task={editingTask}
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
