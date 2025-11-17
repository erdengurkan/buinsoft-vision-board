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
  const { getProjectById, updateProject } = useApp();
  const { logActivity, getProjectLogs } = useActivityLog();
  const { addComment, deleteComment, getProjectComments } = useComments();
  const { getProjectTotalTime } = useWorklog();
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isTaskDetailModalOpen, setIsTaskDetailModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  const [viewingTask, setViewingTask] = useState<Task | null>(null);

  const project = getProjectById(id!);

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

  const handleUpdateTask = (taskId: string, updates: Partial<Task>) => {
    const task = project.tasks.find((t) => t.id === taskId);
    if (!task) return;

    const updatedTasks = project.tasks.map((t) =>
      t.id === taskId ? { ...t, ...updates } : t
    );
    updateProject(project.id, { tasks: updatedTasks });

    // Log activity
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
    } else {
      logActivity(
        project.id,
        "task_edited",
        `Task "${task.title}" updated`,
        { taskId }
      );
    }

    toast.success("Task updated");
  };

  const handleDeleteTask = (taskId: string) => {
    const task = project.tasks.find((t) => t.id === taskId);
    const updatedTasks = project.tasks.filter((t) => t.id !== taskId);
    updateProject(project.id, { tasks: updatedTasks });

    // Log activity
    if (task) {
      logActivity(
        project.id,
        "task_deleted",
        `Task "${task.title}" deleted`,
        { taskId }
      );
    }

    toast.success("Task deleted");
  };

  const handleCreateTask = () => {
    setEditingTask(undefined);
    setIsTaskModalOpen(true);
  };

  const handleSaveTask = (taskData: Partial<Task>) => {
    if (editingTask) {
      handleUpdateTask(editingTask.id, taskData);
    } else {
      const newTask: Task = {
        id: `task-${Date.now()}`,
        title: taskData.title || "",
        description: taskData.description || "",
        status: taskData.status || "Todo",
        assignee: taskData.assignee || "",
        priority: taskData.priority || "Medium",
        createdAt: new Date(),
        deadline: taskData.deadline,
        followUp: taskData.followUp || false,
      };
      const updatedTasks = [...project.tasks, newTask];
      updateProject(project.id, { tasks: updatedTasks });

      // Log activity
      logActivity(
        project.id,
        "task_created",
        `Task "${newTask.title}" created`,
        { taskId: newTask.id }
      );

      toast.success("Task created");
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

      <ActivityTimeline logs={activityLogs} />

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

      {projectTotalTime > 0 && (
        <div className="p-4 rounded-lg border border-border bg-muted/30">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Total Time Spent on Project</span>
            <span className="text-lg font-bold">
              {Math.floor(projectTotalTime / 3600)}h {Math.floor((projectTotalTime % 3600) / 60)}m
            </span>
          </div>
        </div>
      )}

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
