import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Project, Priority } from "@/types";
import { Calendar, User, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface ProjectCardProps {
  project: Project;
  onDelete: (id: string) => void;
}

const priorityColors: Record<Priority, string> = {
  Low: "bg-priority-low text-white",
  Medium: "bg-priority-medium text-white",
  High: "bg-priority-high text-white",
};

export const ProjectCard = ({ project, onDelete }: ProjectCardProps) => {
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
    onDelete(project.id);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative rounded-lg border border-border bg-card p-4 shadow-sm transition-all hover:shadow-md cursor-pointer",
        isDragging && "opacity-50 shadow-lg"
      )}
      onClick={handleClick}
    >
      <div {...attributes} {...listeners} className="drag-handle absolute top-2 right-2 p-1">
        <div className="flex flex-col gap-0.5">
          <div className="h-0.5 w-4 bg-muted-foreground/30 rounded" />
          <div className="h-0.5 w-4 bg-muted-foreground/30 rounded" />
          <div className="h-0.5 w-4 bg-muted-foreground/30 rounded" />
        </div>
      </div>

      <div className="space-y-3">
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

        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Calendar className="h-3 w-3" />
          <span>
            {project.startDate.toLocaleDateString()} -{" "}
            {project.endDate.toLocaleDateString()}
          </span>
        </div>
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="absolute bottom-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={handleDelete}
      >
        <Trash2 className="h-3 w-3 text-destructive" />
      </Button>
    </div>
  );
};
