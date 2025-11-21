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
    <div className="flex items-center gap-1 flex-1">
      <Button onClick={onNewProject} size="sm" className="h-7 gap-1 px-2 text-xs">
        <Plus className="h-3 w-3" />
        <span>New Project</span>
      </Button>
      <Button onClick={onNewTask} variant="outline" size="sm" className="h-7 gap-1 px-2 text-xs">
        <Plus className="h-3 w-3" />
        <span>New Task</span>
      </Button>
      <div className="h-4 w-px bg-border mx-0.5" />
      <Button onClick={onMyTasks} variant="ghost" size="sm" className="h-7 gap-1 px-2 text-xs">
        <ListTodo className="h-3 w-3" />
        <span>My Tasks</span>
      </Button>
      <Button onClick={onTodaysFollowUps} variant="ghost" size="sm" className="h-7 gap-1 px-2 text-xs">
        <Flag className="h-3 w-3" />
        <span>Follow-ups</span>
      </Button>
      <Button onClick={onOverdueTasks} variant="ghost" size="sm" className="h-7 gap-1 px-2 text-xs">
        <AlertCircle className="h-3 w-3" />
        <span>Overdue</span>
      </Button>
    </div>
  );
};

