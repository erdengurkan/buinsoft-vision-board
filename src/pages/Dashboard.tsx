import { useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { ProjectStatus } from "@/types";
import { KanbanColumn } from "@/components/kanban/KanbanColumn";
import { ProjectCard } from "@/components/kanban/ProjectCard";
import { useApp } from "@/contexts/AppContext";
import { toast } from "sonner";

const columns: ProjectStatus[] = ["Potential", "Active", "In Progress", "Done"];

const Dashboard = () => {
  const { projects, updateProject, deleteProject } = useApp();
  const [activeProject, setActiveProject] = useState<any>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: any) => {
    const project = projects.find((p) => p.id === event.active.id);
    if (project) {
      setActiveProject(project);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      setActiveProject(null);
      return;
    }

    const projectId = active.id as string;
    const newStatus = over.id as ProjectStatus;

    if (columns.includes(newStatus)) {
      const project = projects.find((p) => p.id === projectId);
      if (project && project.status !== newStatus) {
        updateProject(projectId, { status: newStatus });
        toast.success(`Project moved to ${newStatus}`);
      }
    }

    setActiveProject(null);
  };

  const handleDeleteProject = (id: string) => {
    deleteProject(id);
    toast.success("Project deleted");
  };

  const getProjectsByStatus = (status: ProjectStatus) => {
    return projects.filter((project) => project.status === status);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Project Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Manage all your projects in one place
        </p>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {columns.map((status) => (
            <KanbanColumn
              key={status}
              status={status}
              projects={getProjectsByStatus(status)}
              onDeleteProject={handleDeleteProject}
            />
          ))}
        </div>
        <DragOverlay>
          {activeProject ? (
            <ProjectCard project={activeProject} onDelete={() => {}} />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
};

export default Dashboard;
