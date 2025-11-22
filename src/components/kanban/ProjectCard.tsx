import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Project, Priority } from "@/types";
import { Calendar, User, Trash2, AlertCircle, Edit, UserPlus, Flag, Zap, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { getDeadlineStatus, getDeadlineColor, hasFollowUpNeeded } from "@/utils/deadlineHelpers";
import { format } from "date-fns";
import { useState } from "react";
import * as React from "react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { ProjectInlineEdit } from "@/components/projects/ProjectInlineEdit";

interface ProjectCardProps {
  project: Project;
  onDelete: (id: string) => void;
  onEdit: (project: Project) => void;
  onUpdateProject?: (projectId: string, updates: Partial<Project>) => void;
}

const priorityColors: Record<Priority, string> = {
  Low: "bg-priority-low text-white",
  Medium: "bg-priority-medium text-white",
  High: "bg-priority-high text-white",
  Critical: "bg-red-900 text-white",
};

export const ProjectCard = ({ project, onDelete, onEdit, onUpdateProject }: ProjectCardProps) => {
  const navigate = useNavigate();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: project.id });

  const [inlineEditOption, setInlineEditOption] = useState<"assign" | "deadline" | "priority" | "hardness" | "benefit" | null>(null);
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleClick = () => {
    navigate(`/project/${project.id}`);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(project.id);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(project);
  };

  const handleContextMenuAction = (option: "assign" | "deadline" | "priority" | "hardness" | "benefit", e?: React.MouseEvent) => {
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

  const handleSave = (updates: Partial<Project>) => {
    if (onUpdateProject) {
      onUpdateProject(project.id, updates);
    }
    setInlineEditOption(null);
  };

  const handleCloseInlineEdit = () => {
    setInlineEditOption(null);
  };

  const deadlineStatus = getDeadlineStatus(project.deadline);
  const needsFollowUp = hasFollowUpNeeded(project.tasks);

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          ref={setNodeRef}
          style={style}
          className={cn(
            "group relative rounded-lg border border-border bg-card p-4 shadow-sm transition-all hover:shadow-md cursor-pointer",
            isDragging && "opacity-50 shadow-lg",
            getDeadlineColor(deadlineStatus)
          )}
          onClick={handleClick}
        >
      <div {...attributes} {...listeners} className="drag-handle absolute top-2 right-2 p-1">
        <div className="flex flex-col gap-0.5">
          <div className="h-1 w-4 bg-muted-foreground/30 rounded" />
          <div className="h-1 w-4 bg-muted-foreground/30 rounded" />
          <div className="h-1 w-4 bg-muted-foreground/30 rounded" />
        </div>
      </div>

      {/* Hardness and Benefit Display */}
      {(project.hardness || project.benefit) && (
        <div className="absolute top-10 right-2 text-right space-y-0.5 z-10">
          {project.hardness && (
            <div className="text-[10px] leading-tight">
              <span>⚡</span>
              <span className="ml-0.5">{project.hardness}</span>
            </div>
          )}
          {project.benefit && (
            <div className="text-[10px] leading-tight">
              <span>💎</span>
              <span className="ml-0.5">{project.benefit}</span>
            </div>
          )}
        </div>
      )}

      <div className="space-y-3">
        {needsFollowUp && (
          <div className="flex items-center gap-1 text-xs text-orange-600 dark:text-orange-400 font-medium">
            <AlertCircle className="h-3 w-3" />
            <span>Follow-up Required</span>
          </div>
        )}
        
        <div>
          <h3 className="font-semibold text-card-foreground mb-1 pr-8">
            {project.title}
          </h3>
          <p className="text-xs text-muted-foreground">{project.client}</p>
        </div>

        <div className="flex flex-wrap gap-1">
          {project.labels.map((label) => (
            <Badge
              key={label.id}
              variant="secondary"
              className={cn("text-xs", label.color, "text-white")}
            >
              {label.name}
            </Badge>
          ))}
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <User className="h-3 w-3" />
            <span>{project.assignee}</span>
          </div>
          <Badge className={cn("text-xs", priorityColors[project.priority])}>
            {project.priority}
          </Badge>
        </div>

        {project.deadline && (
          <div className={cn(
            "flex items-center gap-1 text-xs font-medium",
            deadlineStatus === "overdue" ? "text-red-600 dark:text-red-400" :
            deadlineStatus === "soon" ? "text-orange-600 dark:text-orange-400" :
            "text-muted-foreground"
          )}>
            <Calendar className="h-3 w-3" />
            <span>Due: {format(project.deadline, "MMM d, yyyy")}</span>
          </div>
        )}

        {!project.deadline && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>
              {project.startDate.toLocaleDateString()} -{" "}
              {project.endDate.toLocaleDateString()}
            </span>
          </div>
        )}
      </div>

          <div className="absolute bottom-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={handleEdit}
            >
              <Edit className="h-3 w-3 text-primary" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={handleDelete}
            >
              <Trash2 className="h-3 w-3 text-destructive" />
            </Button>
          </div>
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-48">
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
      {inlineEditOption && onUpdateProject && (
        <ProjectInlineEdit
          project={project}
          option={inlineEditOption}
          onSave={handleSave}
          onClose={handleCloseInlineEdit}
          mousePosition={mousePosition}
        />
      )}
    </ContextMenu>
  );
};
