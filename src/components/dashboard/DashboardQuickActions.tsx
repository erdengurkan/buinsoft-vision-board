import { Button } from "@/components/ui/button";
import { Plus, ListTodo, Flag, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface DashboardQuickActionsProps {
  onNewProject: () => void;
  onNewTask: () => void;
  onMyTasks: () => void;
  onTodaysFollowUps: () => void;
  onOverdueTasks: () => void;
}

export const DashboardQuickActions = ({
  onNewProject,
  onNewTask,
  onMyTasks,
  onTodaysFollowUps,
  onOverdueTasks,
}: DashboardQuickActionsProps) => {
  return (
    <div className="flex items-center gap-2 p-4 bg-muted/30 rounded-lg border border-border">
      <Button onClick={onNewProject} size="sm">
        <Plus className="h-4 w-4 mr-2" />
        New Project
      </Button>
      <Button onClick={onNewTask} variant="outline" size="sm">
        <Plus className="h-4 w-4 mr-2" />
        New Task
      </Button>
      <div className="h-6 w-px bg-border mx-1" />
      <Button onClick={onMyTasks} variant="ghost" size="sm">
        <ListTodo className="h-4 w-4 mr-2" />
        My Tasks
      </Button>
      <Button onClick={onTodaysFollowUps} variant="ghost" size="sm">
        <Flag className="h-4 w-4 mr-2" />
        Today's Follow-ups
      </Button>
      <Button onClick={onOverdueTasks} variant="ghost" size="sm">
        <AlertCircle className="h-4 w-4 mr-2" />
        Overdue Tasks
      </Button>
    </div>
  );
};

