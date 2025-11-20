import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Task, Priority } from "@/types";
import { User, Trash2, Workflow, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useActiveTimers } from "@/hooks/useActiveTimers";

interface TaskCardProps {
  task: Task;
  projectId: string;
  onDelete: (id: string) => void;
  onViewDetails?: (task: Task) => void;
}

const priorityColors: Record<Priority, string> = {
  Low: "bg-priority-low text-white",
  Medium: "bg-priority-medium text-white",
  High: "bg-priority-high text-white",
  Critical: "bg-red-900 text-white",
};

export const TaskCard = ({ task, projectId, onDelete, onViewDetails }: TaskCardProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  // Fetch active timers for this project
  const { data: activeTimers = [] } = useActiveTimers(projectId);

  // Check if someone is working on this task
  const activeTimer = activeTimers.find(timer => timer.taskId === task.id);
  const isBeingWorkedOn = !!activeTimer;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(task.id);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative rounded-lg border bg-card p-3 shadow-sm transition-all hover:shadow-md",
        isDragging && "opacity-50 shadow-lg",
        isBeingWorkedOn 
          ? "border-red-500 border-2 shadow-red-500/20 bg-red-50/50 dark:bg-red-950/20" 
          : "border-border"
      )}
    >
      <div
        {...attributes}
        {...listeners}
        className="drag-handle absolute top-2 right-2 p-1"
      >
        <div className="flex flex-col gap-0.5">
          <div className="h-0.5 w-3 bg-muted-foreground/30 rounded" />
          <div className="h-0.5 w-3 bg-muted-foreground/30 rounded" />
        </div>
      </div>

      <div className="space-y-1.5 pr-6">
        {isBeingWorkedOn && activeTimer && (
          <div className="flex items-center gap-1 mb-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400 font-medium animate-pulse">
                    <Clock className="h-3 w-3" />
                    <span>Working: {activeTimer.userId || "User"}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Being worked on by {activeTimer.userId || "user"}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}
        {task.flowDiagram && (
          <div className="flex items-center gap-1 mb-0.5">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Workflow className="h-3 w-3" />
                    <span>Flow</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>This task has a flow diagram</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}
        <h4
          className="font-medium text-sm text-card-foreground cursor-pointer hover:text-primary transition-colors leading-tight"
          onClick={() => onViewDetails?.(task)}
        >
          {task.title}
        </h4>
        {task.description && (
          <div
            className="text-xs text-muted-foreground line-clamp-2 [&_p]:my-0 [&_p]:inline [&_p:not(:last-child)]:after:content-['_'] [&_br]:hidden [&_*]:text-xs [&_*]:leading-tight"
            dangerouslySetInnerHTML={{
              __html: task.description.replace(/<p><\/p>/g, '').replace(/<br\s*\/?>/gi, ' '),
            }}
          />
        )}

        <div className="flex items-center justify-between gap-2 pt-1">
          <div className="flex items-center gap-1 text-xs text-muted-foreground min-w-0 flex-1">
            <User className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{task.assignee}</span>
          </div>
          <Badge className={cn("text-xs flex-shrink-0 px-1.5 py-0", priorityColors[task.priority])}>
            {task.priority}
          </Badge>
        </div>
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="absolute bottom-2 right-2 h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={handleDelete}
      >
        <Trash2 className="h-3 w-3 text-destructive" />
      </Button>
    </div>
  );
};
