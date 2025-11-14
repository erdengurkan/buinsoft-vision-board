import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { ProjectCard } from "./ProjectCard";
import { Project, ProjectStatus } from "@/types";
import { cn } from "@/lib/utils";
import { getColorFromTailwind } from "@/utils/colorUtils";

interface KanbanColumnProps {
  status: string;
  statusColor?: string;
  projects: Project[];
  onDeleteProject: (id: string) => void;
  onEditProject: (project: Project) => void;
}

export const KanbanColumn = ({
  status,
  statusColor = "border-t-primary",
  projects,
  onDeleteProject,
  onEditProject,
}: KanbanColumnProps) => {
  const { setNodeRef } = useDroppable({ id: status });

  return (
    <div className="flex flex-col min-w-[320px] flex-1">
      <div
        className="mb-4 rounded-lg border-t-4 bg-card p-4"
        style={{ borderTopColor: getColorFromTailwind(statusColor) }}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">{status}</h2>
          <span className="text-xs text-muted-foreground">
            {projects.length}
          </span>
        </div>
      </div>
      <div
        ref={setNodeRef}
        className="flex-1 space-y-3 rounded-lg bg-muted/30 p-3 min-h-[200px]"
      >
        <SortableContext
          items={projects.map((p) => p.id)}
          strategy={verticalListSortingStrategy}
        >
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onDelete={onDeleteProject}
              onEdit={onEditProject}
            />
          ))}
        </SortableContext>
      </div>
    </div>
  );
};
