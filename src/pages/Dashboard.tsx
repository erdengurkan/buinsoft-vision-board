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
import { ProjectStatus, Project } from "@/types";
import { KanbanColumn } from "@/components/kanban/KanbanColumn";
import { ProjectCard } from "@/components/kanban/ProjectCard";
import { ProjectFormModal } from "@/components/modals/ProjectFormModal";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import { toast } from "sonner";

const columns: ProjectStatus[] = ["Potential", "Active", "In Progress", "Done"];

const Dashboard = () => {
  const { projects, updateProject, deleteProject, addProject } = useApp();
  const [activeProject, setActiveProject] = useState<any>(null);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | undefined>(undefined);

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

  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setIsProjectModalOpen(true);
  };

  const handleCreateProject = () => {
    setEditingProject(undefined);
    setIsProjectModalOpen(true);
  };

  const handleSaveProject = (projectData: Partial<Project>) => {
    if (editingProject) {
      updateProject(editingProject.id, projectData);
      toast.success("Project updated");
    } else {
      const newProject: Project = {
        id: `project-${Date.now()}`,
        title: projectData.title || "",
        client: projectData.client || "",
        assignee: projectData.assignee || "",
        priority: projectData.priority || "Medium",
        status: projectData.status || "Potential",
        startDate: projectData.startDate || new Date(),
        endDate: projectData.endDate || new Date(),
        deadline: projectData.deadline,
        followUp: projectData.followUp || false,
        labels: projectData.labels || [],
        description: projectData.description || "",
        tasks: [],
      };
      addProject(newProject);
      toast.success("Project created");
    }
  };

  const getProjectsByStatus = (status: ProjectStatus) => {
    return projects.filter((project) => project.status === status);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Project Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Manage all your projects in one place
          </p>
        </div>
        <Button onClick={handleCreateProject}>
          <Plus className="h-4 w-4 mr-2" />
          New Project
        </Button>
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
              onEditProject={handleEditProject}
            />
          ))}
        </div>
        <DragOverlay>
          {activeProject ? (
            <ProjectCard project={activeProject} onDelete={() => {}} onEdit={() => {}} />
          ) : null}
        </DragOverlay>
      </DndContext>

      <ProjectFormModal
        open={isProjectModalOpen}
        onOpenChange={setIsProjectModalOpen}
        project={editingProject}
        onSave={handleSaveProject}
      />
    </div>
  );
};

export default Dashboard;
