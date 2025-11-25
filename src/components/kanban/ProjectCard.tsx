import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Project, Priority } from "@/types";
import { Calendar, User, Trash2, AlertCircle, Edit } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { getDeadlineStatus, getDeadlineColor, hasFollowUpNeeded } from "@/utils/deadlineHelpers";
import { format } from "date-fns";

interface ProjectCardProps {
  project: Project;
  onDelete: (id: string) => void;
  onEdit: (project: Project) => void;
}

const priorityColors: Record<Priority, string> = {
  Low: "bg-priority-low text-white",
  Medium: "bg-priority-medium text-white",
  High: "bg-priority-high text-white",
  Critical: "bg-red-900 text-white",
};

export const ProjectCard = ({ project, onDelete, onEdit }: ProjectCardProps) => {
  const navigate = useNavigate();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: project.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleClick = () => {
    navigate(`/project/${project.id}`);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onDelete(project.id);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onEdit(project);
  };

  const handleDragHandleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
  };

  const deadlineStatus = getDeadlineStatus(project.deadline);
  const needsFollowUp = hasFollowUpNeeded(project.tasks);

  return (
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
      <div className="space-y-3">
        {needsFollowUp && (
          <div className="flex items-center gap-1 text-xs text-orange-600 dark:text-orange-400 font-medium">
            <AlertCircle className="h-3 w-3" />
            <span>Follow-up Required</span>
          </div>
        )}
        
        {/* Header Bölgesi: Title + Drag Handle + Hardness/Benefit */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-card-foreground mb-1">
              {project.title}
            </h3>
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-xs text-muted-foreground">{project.client}</p>
              {/* Hardness and Benefit Display - Next to client */}
              {(project.hardness || project.benefit) && (
                <div className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground">
                  {project.hardness && (
                    <span>⚡{project.hardness}</span>
                  )}
                  {project.benefit && (
                    <span>💎{project.benefit}</span>
                  )}
                </div>
              )}
            </div>
          </div>
          <div 
            {...attributes} 
            {...listeners} 
            onClick={handleDragHandleClick}
            className="drag-handle flex-shrink-0 p-1.5 cursor-grab active:cursor-grabbing bg-card/80 backdrop-blur-sm rounded hover:bg-card/90 transition-colors"
          >
            <div className="flex flex-col gap-0.5">
              <div className="h-1 w-4 bg-muted-foreground/40 rounded" />
              <div className="h-1 w-4 bg-muted-foreground/40 rounded" />
              <div className="h-1 w-4 bg-muted-foreground/40 rounded" />
            </div>
          </div>
        </div>

        {project.labels.length > 0 && (
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
        )}

        {/* Deadline/Date Display */}
        {project.deadline ? (
          <div className={cn(
            "flex items-center gap-1 text-xs font-medium",
            deadlineStatus === "overdue" ? "text-red-600 dark:text-red-400" :
            deadlineStatus === "soon" ? "text-orange-600 dark:text-orange-400" :
            "text-muted-foreground"
          )}>
            <Calendar className="h-3 w-3 flex-shrink-0" />
            <span>Due: {format(project.deadline, "MMM d, yyyy")}</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3 flex-shrink-0" />
            <span>
              {project.startDate.toLocaleDateString()} -{" "}
              {project.endDate.toLocaleDateString()}
            </span>
          </div>
        )}

        {/* Footer Bölgesi: Assignee + Priority Badge + Edit/Delete Butonları */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/50">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <User className="h-3 w-3" />
            <span>{project.assignee}</span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Badge className={cn("text-xs", priorityColors[project.priority])}>
              {project.priority}
            </Badge>
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                type="button"
                className="h-4 w-4 p-0 flex items-center justify-center hover:bg-muted/50 rounded transition-colors"
                onClick={handleEdit}
                onMouseDown={(e) => e.stopPropagation()}
              >
                <Edit className="h-3 w-3 text-muted-foreground hover:text-primary" />
              </button>
              <button
                type="button"
                className="h-4 w-4 p-0 flex items-center justify-center hover:bg-muted/50 rounded transition-colors"
                onClick={handleDelete}
                onMouseDown={(e) => e.stopPropagation()}
              >
                <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
