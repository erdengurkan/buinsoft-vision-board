import { useState } from "react";
import * as React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Task, Priority } from "@/types";
import { User, Trash2, Workflow, Clock, Play, UserPlus, Calendar, Flag, Zap, Sparkles } from "lucide-react";
import { isPast, isToday } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useActiveTimers } from "@/hooks/useActiveTimers";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { TaskInlineEdit } from "@/components/tasks/TaskInlineEdit";

interface TaskCardProps {
  task: Task;
  projectId: string;
  onDelete: (id: string) => void;
  onViewDetails?: (task: Task) => void;
  onEditTask?: (task: Task) => void;
  onUpdateTask?: (taskId: string, updates: Partial<Task>) => void;
}

const priorityColors: Record<Priority, string> = {
  Low: "bg-priority-low text-white",
  Medium: "bg-priority-medium text-white",
  High: "bg-priority-high text-white",
  Critical: "bg-red-900 text-white",
};

export const TaskCard = ({ task, projectId, onDelete, onViewDetails, onEditTask, onUpdateTask }: TaskCardProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const [inlineEditOption, setInlineEditOption] = useState<"work" | "assign" | "deadline" | "priority" | "hardness" | "benefit" | null>(null);
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null);

  // Fetch active timers for this project
  const { data: activeTimers = [] } = useActiveTimers(projectId);

  // Check if someone is working on this task
  const activeTimer = activeTimers.find(timer => timer.taskId === task.id);
  const isBeingWorkedOn = !!activeTimer;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Check if task is overdue
  const isTaskOverdue = task.deadline && isPast(new Date(task.deadline)) && !isToday(new Date(task.deadline));

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(task.id);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEditTask) {
      onEditTask(task);
    } else if (onViewDetails) {
      onViewDetails(task);
    }
  };

  const handleContextMenuAction = (option: "work" | "assign" | "deadline" | "priority" | "hardness" | "benefit", e?: React.MouseEvent) => {
    // Get position from the menu item that was clicked - use setTimeout to ensure context menu is still in DOM
    setTimeout(() => {
      if (e && e.currentTarget) {
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        // Position popover to the right of the menu item
        setMousePosition({ 
          x: rect.right + 10, 
          y: rect.top 
        });
      } else {
        // Fallback: try to get context menu position
        const contextMenu = document.querySelector('[data-radix-context-menu-content]');
        if (contextMenu) {
          const rect = contextMenu.getBoundingClientRect();
          setMousePosition({ x: rect.right + 10, y: rect.top });
        } else {
          // Last resort: use stored mouse position
          const lastEvent = (window as any).__lastMouseEvent;
          if (lastEvent) {
            setMousePosition({ x: lastEvent.clientX + 10, y: lastEvent.clientY });
          }
        }
      }
    }, 0);
    setInlineEditOption(option);
  };

  // Track mouse position globally for context menu
  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      (window as any).__lastMouseEvent = e;
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  const handleSave = (updates: Partial<Task>) => {
    if (onUpdateTask) {
      onUpdateTask(task.id, updates);
    }
    setInlineEditOption(null);
  };

  const handleCloseInlineEdit = () => {
    setInlineEditOption(null);
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          ref={setNodeRef}
          style={style}
          onDoubleClick={handleDoubleClick}
          className={cn(
            "group relative rounded-lg border bg-card p-3 shadow-sm transition-all hover:shadow-md cursor-pointer",
            isDragging && "opacity-50 shadow-lg",
            isBeingWorkedOn 
              ? "border-red-500 border-2 shadow-red-500/20 bg-red-50/50 dark:bg-red-950/20" 
              : isTaskOverdue
              ? "border-red-500 border-2 shadow-red-500/20 bg-red-50/30 dark:bg-red-950/10"
              : "border-border"
          )}
        >
          <div
            {...attributes}
            {...listeners}
            className="drag-handle absolute top-2 right-2 p-1"
          >
            <div className="flex flex-col gap-0.5">
              <div className="h-1 w-4 bg-muted-foreground/30 rounded" />
              <div className="h-1 w-4 bg-muted-foreground/30 rounded" />
            </div>
          </div>

          {/* Hardness and Benefit Display */}
          {(task.hardness || task.benefit) && (
            <div className="absolute top-10 right-2 text-right space-y-0.5 z-10">
              {task.hardness && (
                <div className="text-[10px] leading-tight">
                  <span>⚡</span>
                  <span className="ml-0.5">{task.hardness}</span>
                </div>
              )}
              {task.benefit && (
                <div className="text-[10px] leading-tight">
                  <span>💎</span>
                  <span className="ml-0.5">{task.benefit}</span>
                </div>
              )}
            </div>
          )}

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
            className="text-xs text-muted-foreground whitespace-pre-wrap [&_p]:my-0 [&_*]:text-xs [&_*]:leading-tight"
            dangerouslySetInnerHTML={{
              __html: task.description,
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
      </ContextMenuTrigger>
      <ContextMenuContent className="w-48">
        <ContextMenuItem onClick={(e) => handleContextMenuAction("work", e)}>
          <Play className="mr-2 h-4 w-4" />
          <span>Work on this</span>
        </ContextMenuItem>
        <ContextMenuItem onClick={(e) => handleContextMenuAction("assign", e)}>
          <UserPlus className="mr-2 h-4 w-4" />
          <span>Assign to</span>
        </ContextMenuItem>
        <ContextMenuItem onClick={(e) => handleContextMenuAction("deadline", e)}>
          <Calendar className="mr-2 h-4 w-4" />
          <span>Set deadline</span>
        </ContextMenuItem>
        <ContextMenuItem onClick={(e) => handleContextMenuAction("priority", e)}>
          <Flag className="mr-2 h-4 w-4" />
          <span>Change Priority</span>
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={(e) => handleContextMenuAction("hardness", e)}>
          <Zap className="mr-2 h-4 w-4" />
          <span>Set Hardness</span>
        </ContextMenuItem>
        <ContextMenuItem onClick={(e) => handleContextMenuAction("benefit", e)}>
          <Sparkles className="mr-2 h-4 w-4" />
          <span>Set Benefit</span>
        </ContextMenuItem>
      </ContextMenuContent>
      {inlineEditOption && onUpdateTask && (
        <TaskInlineEdit
          task={task}
          projectId={projectId}
          option={inlineEditOption}
          onSave={handleSave}
          onClose={handleCloseInlineEdit}
          mousePosition={mousePosition}
        />
      )}
    </ContextMenu>
  );
};
