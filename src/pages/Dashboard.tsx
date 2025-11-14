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
import { DashboardFilters } from "@/components/dashboard/DashboardFilters";
import { DashboardQuickActions } from "@/components/dashboard/DashboardQuickActions";
import { useApp } from "@/contexts/AppContext";
import { useActivityLog } from "@/hooks/useActivityLog";
import { useDashboardFilters } from "@/hooks/useDashboardFilters";
import { toast } from "sonner";

const columns: ProjectStatus[] = ["Potential", "Active", "In Progress", "Done"];

const Dashboard = () => {
  const { projects, updateProject, deleteProject, addProject } = useApp();
  const { logActivity } = useActivityLog();
  const {
    filters,
    sortBy,
    filteredAndSortedProjects,
    updateFilter,
    toggleFilter,
    clearFilters,
    setSortBy,
    hasActiveFilters,
  } = useDashboardFilters(projects);
  const [activeProject, setActiveProject] = useState<any>(null);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | undefined>(undefined);
  
  // Get current user (placeholder - in real app this would come from auth)
  const currentUser = "Emre Kılınç";

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: any) => {
    const project = filteredAndSortedProjects.find((p) => p.id === event.active.id);
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
      const project = filteredAndSortedProjects.find((p) => p.id === projectId);
      if (project && project.status !== newStatus) {
        updateProject(projectId, { status: newStatus });
        
        // Log activity
        logActivity(
          projectId,
          "project_status_changed",
          `Project "${project.title}" status changed`,
          {
            oldStatus: project.status,
            newStatus: newStatus,
          }
        );
        
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
      
      // Log activity
      logActivity(
        editingProject.id,
        "project_edited",
        `Project "${editingProject.title}" updated`,
        {}
      );
      
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
      
      // Log activity
      logActivity(
        newProject.id,
        "project_created",
        `Project "${newProject.title}" created`,
        {}
      );
      
      toast.success("Project created");
    }
  };

  const getProjectsByStatus = (status: ProjectStatus) => {
    return filteredAndSortedProjects.filter((project) => project.status === status);
  };

  // Quick action handlers
  const handleNewTask = () => {
    // Find first project or show message
    if (filteredAndSortedProjects.length > 0) {
      // In a real app, this would open a task modal with project selection
      toast.info("Select a project to add a task, or navigate to a project detail page");
    } else {
      toast.info("Create a project first");
    }
  };

  const handleMyTasks = () => {
    updateFilter("assignee", [currentUser]);
    toast.success(`Filtered to tasks assigned to ${currentUser}`);
  };

  const handleTodaysFollowUps = () => {
    updateFilter("followUpRequired", true);
    // Also filter to projects with tasks that have follow-up and deadline today
    toast.success("Filtered to today's follow-ups");
  };

  const handleOverdueTasks = () => {
    updateFilter("deadlineFilter", "overdue");
    toast.success("Filtered to overdue tasks");
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
      </div>

      <DashboardQuickActions
        onNewProject={handleCreateProject}
        onNewTask={handleNewTask}
        onMyTasks={handleMyTasks}
        onTodaysFollowUps={handleTodaysFollowUps}
        onOverdueTasks={handleOverdueTasks}
      />

      <DashboardFilters
        filters={filters}
        sortBy={sortBy}
        projects={projects}
        onFilterChange={updateFilter}
        onToggleFilter={toggleFilter}
        onSortChange={setSortBy}
        onClearFilters={clearFilters}
        hasActiveFilters={hasActiveFilters}
      />

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
