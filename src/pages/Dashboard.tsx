import { useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { ProjectStatus, Project } from "@/types";
import { KanbanColumn } from "@/components/kanban/KanbanColumn";
import { ProjectCard } from "@/components/kanban/ProjectCard";
import { ProjectFormModal } from "@/components/modals/ProjectFormModal";
import { DashboardFilters } from "@/components/dashboard/DashboardFilters";
import { DashboardQuickActions } from "@/components/dashboard/DashboardQuickActions";
import { RecentComments } from "@/components/dashboard/RecentComments";
import { useApp } from "@/contexts/AppContext";
import { useWorkflow } from "@/contexts/WorkflowContext";
import { useActivityLog } from "@/hooks/useActivityLog";
import { useDashboardFilters } from "@/hooks/useDashboardFilters";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { MessageSquare, ChevronDown } from "lucide-react";

const Dashboard = () => {
  const { projects, updateProject, deleteProject, addProject } = useApp();
  const { projectStatuses } = useWorkflow();
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
  const [isCommentsCollapsed, setIsCommentsCollapsed] = useState(false);

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

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;

    if (!over) return;

    const projectId = active.id as string;
    const overId = over.id as string;

    const project = filteredAndSortedProjects.find((p) => p.id === projectId);
    if (!project) return;

    // Check if over a project or status column
    const overProject = filteredAndSortedProjects.find((p) => p.id === overId);
    const isOverStatus = projectStatuses.some((s) => s.name === overId);

    // If dragging over a project in the same status, we can reorder
    // If dragging over a different status column or project in different status, we can move
    // The visual feedback is handled by @dnd-kit automatically
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      setActiveProject(null);
      return;
    }

    const projectId = active.id as string;
    const overId = over.id as string;

    // Find the dragged project
    const project = filteredAndSortedProjects.find((p) => p.id === projectId);
    if (!project) {
      setActiveProject(null);
      return;
    }

    // Check if dropping on a status column (droppable area)
    const isOverStatus = projectStatuses.some((s) => s.name === overId);

    // Check if dropping on another project
    const overProject = filteredAndSortedProjects.find((p) => p.id === overId);

    if (isOverStatus) {
      // Moving to a different status column (dropped on empty area of column)
      const newStatus = overId as ProjectStatus;
      if (project.status !== newStatus) {
        updateProject(projectId, { status: newStatus, order: 0 });

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
    } else if (overProject) {
      // Dropping on another project - check if same status or different
      if (project.status === overProject.status) {
        // Reordering within the same status
        const statusProjects = filteredAndSortedProjects
          .filter((p) => p.status === project.status)
          .sort((a, b) => {
            const aOrder = (a as any).order ?? 0;
            const bOrder = (b as any).order ?? 0;
            return aOrder - bOrder;
          });

        const oldIndex = statusProjects.findIndex((p) => p.id === projectId);
        const newIndex = statusProjects.findIndex((p) => p.id === overId);

        if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
          // Use arrayMove to get the correct reordered array
          const reordered = arrayMove(statusProjects, oldIndex, newIndex);

          // Update order for all projects in this status based on new positions
          reordered.forEach((p, index) => {
            updateProject(p.id, { order: index });
          });
        }
      } else {
        // Moving to different status (dropped on project in different column)
        const newStatusProjects = filteredAndSortedProjects
          .filter((p) => p.status === overProject.status)
          .sort((a, b) => {
            const aOrder = (a as any).order ?? 0;
            const bOrder = (b as any).order ?? 0;
            return aOrder - bOrder;
          });

        const targetIndex = newStatusProjects.findIndex((p) => p.id === overId);

        if (targetIndex !== -1) {
          // Move project to new status first
          updateProject(projectId, { status: overProject.status });

          // Then reorder: insert dragged project at target position
          // All projects from targetIndex onwards get their order incremented
          newStatusProjects.forEach((p, index) => {
            if (index >= targetIndex) {
              updateProject(p.id, { order: index + 1 });
            }
          });

          // Set dragged project's order to targetIndex
          updateProject(projectId, { order: targetIndex });

          // Log activity
          logActivity(
            projectId,
            "project_status_changed",
            `Project "${project.title}" status changed`,
            {
              oldStatus: project.status,
              newStatus: overProject.status,
            }
          );

          toast.success(`Project moved to ${overProject.status}`);
        }
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
      const newProject: Partial<Project> = {
        // Remove id - let backend/Prisma generate UUID
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
    const statusProjects = filteredAndSortedProjects.filter((project) => project.status === status);
    // Sort by order if available, otherwise maintain current order
    return statusProjects.sort((a, b) => {
      const aOrder = (a as any).order ?? 999;
      const bOrder = (b as any).order ?? 999;
      if (aOrder === bOrder) {
        // If orders are equal, maintain original order
        return filteredAndSortedProjects.indexOf(a) - filteredAndSortedProjects.indexOf(b);
      }
      return aOrder - bOrder;
    });
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

  const handleQuickCreateProject = (status: string, title: string) => {
    const newProject: Partial<Project> = {
      title,
      status,
      client: "New Client",
      assignee: currentUser,
      priority: "Medium",
      startDate: new Date(),
      endDate: new Date(new Date().setDate(new Date().getDate() + 30)),
      description: "Quickly added project",
      tasks: [],
    };
    addProject(newProject);

    // Log activity
    // We don't have the ID yet, so we can't log activity here effectively unless we wait for response
    // But addProject is optimistic/async. For now, we skip explicit logging here as the mutation onSuccess could handle it if we refactored.
    // Or we just log a generic "Project created" without ID if the logger supports it, but it requires ID.
    // So we'll rely on the mutation's success toast.
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-none px-6 pt-4 pb-2">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Project Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Manage all your projects in one place
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsCommentsCollapsed(!isCommentsCollapsed)}
            className={cn("gap-2", !isCommentsCollapsed && "bg-accent")}
          >
            <MessageSquare className="h-4 w-4" />
            Comments
          </Button>
        </div>

        <DashboardQuickActions
          onNewProject={handleCreateProject}
          onNewTask={handleNewTask}
          onMyTasks={handleMyTasks}
          onTodaysFollowUps={handleTodaysFollowUps}
          onOverdueTasks={handleOverdueTasks}
        />

        <div className="mt-4">
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
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-x-auto overflow-y-hidden px-6 pb-6">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 h-full min-w-max">
            {projectStatuses
              .sort((a, b) => a.order - b.order)
              .map((statusColumn) => (
                <div key={statusColumn.id} className="w-80 h-full flex flex-col">
                  <KanbanColumn
                    status={statusColumn.name}
                    statusColor={statusColumn.color}
                    projects={getProjectsByStatus(statusColumn.name)}
                    onDeleteProject={handleDeleteProject}
                    onEditProject={handleEditProject}
                    onQuickCreate={handleQuickCreateProject}
                  />
                </div>
              ))}
          </div>
          <DragOverlay>
            {activeProject ? (
              <ProjectCard project={activeProject} onDelete={() => { }} onEdit={() => { }} />
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Floating Comments Panel */}
      {!isCommentsCollapsed && (
        <div className="fixed bottom-4 right-4 z-50 w-[90vw] sm:w-96 max-h-[70vh] bg-background border border-border rounded-lg shadow-2xl flex flex-col">
          <div className="flex items-center justify-between p-3 border-b border-border bg-muted/30">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Recent Comments
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCommentsCollapsed(true)}
              className="h-6 w-6 p-0"
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>
          <div className="overflow-y-auto flex-1">
            <RecentComments
              onCollapseChange={setIsCommentsCollapsed}
              isCollapsed={false}
            />
          </div>
        </div>
      )}

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
