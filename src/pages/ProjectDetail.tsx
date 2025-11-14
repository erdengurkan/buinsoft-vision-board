import { useParams, useNavigate } from "react-router-dom";
import { useApp } from "@/contexts/AppContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, User, AlertCircle, Plus } from "lucide-react";
import { TaskKanban } from "@/components/kanban/TaskKanban";
import { TaskFormModal } from "@/components/modals/TaskFormModal";
import { cn } from "@/lib/utils";
import { Priority, Task } from "@/types";
import { getDeadlineStatus, hasFollowUpNeeded } from "@/utils/deadlineHelpers";
import { toast } from "sonner";
import { useState } from "react";
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
  const { getProjectById, updateProject } = useApp();
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);

  const project = getProjectById(id!);

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
    const updatedTasks = project.tasks.map((task) =>
      task.id === taskId ? { ...task, ...updates } : task
    );
    updateProject(project.id, { tasks: updatedTasks });
    toast.success("Task updated");
  };

  const handleDeleteTask = (taskId: string) => {
    const updatedTasks = project.tasks.filter((task) => task.id !== taskId);
    updateProject(project.id, { tasks: updatedTasks });
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
          />
        ) : (
          <div className="text-center py-12 bg-muted/30 rounded-lg">
            <p className="text-muted-foreground">
              No tasks yet for this project
            </p>
          </div>
        )}
      </div>

      <TaskFormModal
        open={isTaskModalOpen}
        onOpenChange={setIsTaskModalOpen}
        task={editingTask}
        onSave={handleSaveTask}
      />
    </div>
  );
};

export default ProjectDetail;

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
        <h2 className="text-2xl font-bold text-foreground mb-4">Tasks</h2>
        {project.tasks.length > 0 ? (
          <TaskKanban
            tasks={project.tasks}
            onUpdateTask={handleUpdateTask}
            onDeleteTask={handleDeleteTask}
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
  );
};

export default ProjectDetail;
