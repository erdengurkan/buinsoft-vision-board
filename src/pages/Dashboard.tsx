import { useState, useRef } from "react";
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
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { MessageSquare, ChevronDown, Plus, ZoomIn, ZoomOut, Maximize2, Lock, Unlock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const Dashboard = () => {
  const { user, isLoading: authLoading } = useAuth();
  const { projects, updateProject, deleteProject, addProject, isLoading: projectsLoading } = useApp();
  const { projectStatuses, addProjectStatus, updateProjectStatus, deleteProjectStatus, reorderProjectStatuses } = useWorkflow();
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
  const [isCommentsCollapsed, setIsCommentsCollapsed] = useState(true);
  
  // Status management state
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [editingStatusId, setEditingStatusId] = useState<string | null>(null);
  const [newStatusName, setNewStatusName] = useState("");
  const [newStatusColor, setNewStatusColor] = useState("bg-blue-500");
  const [addStatusPosition, setAddStatusPosition] = useState<'start' | 'end'>('end');

  // Zoom and Pan states
  const [zoom, setZoom] = useState(0.75); // Default zoom at 75%
  const [pan, setPan] = useState({ x: 20, y: 20 }); // Default offset for better initial view
  const [isLocked, setIsLocked] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const kanbanContainerRef = useRef<HTMLDivElement>(null);
  const kanbanContentRef = useRef<HTMLDivElement>(null);

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

  const handleUpdateProject = (projectId: string, updates: Partial<Project>) => {
    updateProject(projectId, updates);
    toast.success("Project updated");
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

      // Note: Can't log activity here as newProject.id is undefined (async operation)
      // Activity will be logged in the mutation's onSuccess if needed
      
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
      client: "Quick Add",
      assignee: currentUser,
      priority: "Medium",
      startDate: new Date(),
      endDate: new Date(new Date().setDate(new Date().getDate() + 30)),
      description: "Quickly added project",
      labels: [],
      tasks: [],
    };
    addProject(newProject);
    
    toast.success(`"${title}" added to ${status}`);
  };

  const handleEditStatus = (statusId: string, newName?: string, newColor?: string) => {
    const status = projectStatuses.find(s => s.id === statusId);
    if (status) {
      if (newName !== undefined && newColor !== undefined) {
        // Inline edit
        updateProjectStatus(statusId, { name: newName, color: newColor });
      } else {
        // Dialog edit (for dropdown menu)
        setEditingStatusId(statusId);
        setNewStatusName(status.name);
        setNewStatusColor(status.color);
        setShowStatusDialog(true);
      }
    }
  };

  const handleAddStatus = () => {
    setEditingStatusId(null);
    setNewStatusName("");
    setNewStatusColor("bg-blue-500");
    setAddStatusPosition('end');
    setShowStatusDialog(true);
  };

  const handleSaveStatus = async () => {
    if (!newStatusName.trim()) {
      toast.error("Status name cannot be empty");
      return;
    }

    try {
      if (editingStatusId) {
        // Update existing status
        await updateProjectStatus(editingStatusId, {
          name: newStatusName.trim(),
          color: newStatusColor,
        });
        toast.success("Status updated");
      } else {
        // Add new status
        let order = 0;
        if (addStatusPosition === 'end') {
          order = projectStatuses.length > 0
            ? Math.max(...projectStatuses.map(s => s.order)) + 1
            : 0;
        } else {
          order = 0;
        }

        await addProjectStatus({
          name: newStatusName.trim(),
          color: newStatusColor,
          order,
        });
        toast.success("Status added");
      }

      setShowStatusDialog(false);
      setNewStatusName("");
      setNewStatusColor("bg-blue-500");
      setEditingStatusId(null);
    } catch (error: any) {
      console.error("Error saving status:", error);
      toast.error(error?.message || "Failed to save status");
    }
  };

  const handleDeleteStatus = async (statusId: string) => {
    const status = projectStatuses.find(s => s.id === statusId);
    if (!status) return;

    // Check if status is used by any projects
    const projectsWithStatus = filteredAndSortedProjects.filter(p => p.status === status.name);
    if (projectsWithStatus.length > 0) {
      toast.error(`Cannot delete status. ${projectsWithStatus.length} project(s) are using it.`);
      return;
    }

    try {
      await deleteProjectStatus(statusId);
      toast.success("Status deleted");
    } catch (error: any) {
      console.error("Error deleting status:", error);
      toast.error(error?.message || "Failed to delete status");
    }
  };

  const [filtersExpanded, setFiltersExpanded] = useState(true);

  // Show loading state
  if (authLoading || projectsLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Loading projects...</p>
        </div>
      </div>
    );
  }

  // If user is not loaded after auth loading is complete, show error
  if (!authLoading && !user) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Please log in to view projects</p>
        </div>
      </div>
    );
  }

  // Show empty state if no projects
  if (!projectsLoading && projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-2">No projects yet</h2>
          <p className="text-sm text-muted-foreground mb-4">Create your first project to get started</p>
          <Button onClick={handleCreateProject}>
            <Plus className="h-4 w-4 mr-2" />
            Create Project
          </Button>
        </div>
      </div>
    );
  }

  // Mouse wheel zoom handler
  const handleWheel = (e: React.WheelEvent) => {
    if (isLocked) return;
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    const newZoom = Math.max(0.5, Math.min(2.0, zoom + delta));
    setZoom(newZoom);
  };

  // Mouse drag-to-pan functionality
  const handleMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (
      target.closest('[role="button"]') ||
      target.closest('button') ||
      target.closest('a') ||
      target.closest('[data-dnd-kit-drag-handle]') ||
      target.closest('[data-dnd-kit-sortable]')
    ) {
      return;
    }
    if (isLocked) return;
    setIsDragging(true);
    setStartPos({ x: e.pageX, y: e.pageY });
    setPanStart(pan);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || isLocked) return;
    e.preventDefault();
    const deltaX = e.pageX - startPos.x;
    const deltaY = e.pageY - startPos.y;
    setPan({
      x: panStart.x + deltaX,
      y: panStart.y + deltaY,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  // Zoom control handlers
  const handleZoomIn = () => {
    if (isLocked) return;
    setZoom((prev) => Math.min(2.0, prev + 0.1));
  };

  const handleZoomOut = () => {
    if (isLocked) return;
    setZoom((prev) => Math.max(0.5, prev - 0.1));
  };

  const handleFitView = () => {
    if (isLocked) return;
    setZoom(0.75);
    setPan({ x: 20, y: 20 }); // Reset to default offset
  };

  const handleToggleLock = () => {
    setIsLocked((prev) => !prev);
    if (!isLocked) {
      setIsDragging(false);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden min-h-0">
      <div className="flex-none px-3 pb-1.5 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shrink-0">
        <div className="flex items-center justify-between gap-3 mb-1.5">
          <h1 className="text-lg font-semibold text-foreground">Project Dashboard</h1>
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddStatus}
              className="h-7 gap-1 px-2"
            >
              <Plus className="h-3 w-3" />
              <span className="text-xs">Status</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCommentsCollapsed(!isCommentsCollapsed)}
              className={cn("h-7 gap-1 px-2", !isCommentsCollapsed && "bg-accent")}
            >
              <MessageSquare className="h-3 w-3" />
              <span className="text-xs">Comments</span>
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-1.5 mb-1.5">
          <DashboardQuickActions
            onNewProject={handleCreateProject}
            onNewTask={handleNewTask}
            onMyTasks={handleMyTasks}
            onTodaysFollowUps={handleTodaysFollowUps}
            onOverdueTasks={handleOverdueTasks}
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setFiltersExpanded(!filtersExpanded)}
            className="h-7 text-xs px-2"
          >
            {filtersExpanded ? "Hide" : "Show"} Filters
          </Button>
        </div>

        {filtersExpanded && (
          <div className="pb-1.5">
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
        )}
      </div>

      <div
        ref={kanbanContainerRef}
        className="flex-1 min-h-0 overflow-hidden relative h-full"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        style={{ cursor: isLocked ? 'default' : isDragging ? 'grabbing' : 'grab' }}
      >
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div
            ref={kanbanContentRef}
            className="flex gap-4 h-full min-w-max"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: 'top left',
              transition: isDragging ? 'none' : 'transform 0.1s ease-out',
            }}
          >
            {/* Add Status Button - Only show before first status */}
            {addProjectStatus && (
              <div className="flex items-start pt-12 shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setAddStatusPosition('start');
                    setShowStatusDialog(true);
                  }}
                  className="h-8 w-8 p-0 rounded-full border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/50"
                  title="Add new status at start"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            )}

            {projectStatuses
              .sort((a, b) => a.order - b.order)
              .map((statusColumn, index) => (
                <div key={statusColumn.id} className="flex items-start gap-2 shrink-0">
                  <div className="w-80 h-full flex flex-col">
                    <KanbanColumn
                      status={statusColumn.name}
                      statusId={statusColumn.id}
                      statusColor={statusColumn.color}
                      projects={getProjectsByStatus(statusColumn.name)}
                      onDeleteProject={handleDeleteProject}
                      onEditProject={handleEditProject}
                      onUpdateProject={handleUpdateProject}
                      onQuickCreate={handleQuickCreateProject}
                      onEditStatus={handleEditStatus}
                      onDeleteStatus={getProjectsByStatus(statusColumn.name).length === 0 ? () => handleDeleteStatus(statusColumn.id) : undefined}
                    />
                  </div>
                  {/* Add Status Button after each column (only after last) */}
                  {addProjectStatus && index === projectStatuses.length - 1 && (
                    <div className="flex items-start pt-12">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setAddStatusPosition('end');
                          setShowStatusDialog(true);
                        }}
                        className="h-8 w-8 p-0 rounded-full border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/50"
                        title="Add new status at end"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
          </div>
          <DragOverlay>
            {activeProject ? (
              <ProjectCard project={activeProject} onDelete={() => { }} onEdit={() => { }} />
            ) : null}
          </DragOverlay>
        </DndContext>
        
        {/* Zoom Controls - Bottom Left */}
        <div className="fixed bottom-4 left-4 z-50">
          <div className="flex flex-col gap-1 bg-card border-2 border-primary/20 rounded-lg shadow-xl p-1.5 backdrop-blur-sm">
            <Button
              onClick={handleZoomIn}
              disabled={isLocked || zoom >= 2.0}
              className="rounded-md h-8 w-8 p-0 bg-primary hover:bg-primary/90 text-primary-foreground shadow-md transition-all disabled:opacity-50"
              size="sm"
              title="Zoom In (+)"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button
              onClick={handleZoomOut}
              disabled={isLocked || zoom <= 0.5}
              className="rounded-md h-8 w-8 p-0 bg-primary hover:bg-primary/90 text-primary-foreground shadow-md transition-all disabled:opacity-50"
              size="sm"
              title="Zoom Out (-)"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button
              onClick={handleFitView}
              disabled={isLocked}
              className="rounded-md h-8 w-8 p-0 bg-primary hover:bg-primary/90 text-primary-foreground shadow-md transition-all disabled:opacity-50"
              size="sm"
              title="Fit View (75%)"
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
            <Button
              onClick={handleToggleLock}
              className={`rounded-md h-8 w-8 p-0 shadow-md transition-all ${
                isLocked
                  ? 'bg-destructive hover:bg-destructive/90 text-destructive-foreground'
                  : 'bg-primary hover:bg-primary/90 text-primary-foreground'
              }`}
              size="sm"
              title={isLocked ? 'Unlock' : 'Lock'}
            >
              {isLocked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
            </Button>
          </div>
        </div>
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

      {/* Status Management Dialog */}
      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingStatusId ? "Edit Status" : "Add New Status"}
            </DialogTitle>
            <DialogDescription>
              {editingStatusId 
                ? "Update the status name and color."
                : "Create a new project status column for your dashboard."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Status Name</Label>
              <Input
                value={newStatusName}
                onChange={(e) => setNewStatusName(e.target.value)}
                placeholder="e.g., Review, Blocked, On Hold"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newStatusName.trim()) {
                    handleSaveStatus();
                  }
                }}
              />
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex gap-2 flex-wrap">
                {[
                  "bg-blue-500",
                  "bg-green-500",
                  "bg-yellow-500",
                  "bg-orange-500",
                  "bg-red-500",
                  "bg-purple-500",
                  "bg-pink-500",
                  "bg-indigo-500",
                  "bg-teal-500",
                  "bg-cyan-500",
                ].map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setNewStatusColor(color)}
                    className={cn(
                      "w-8 h-8 rounded-full border-2 transition-all",
                      color,
                      newStatusColor === color ? "border-foreground scale-110" : "border-transparent"
                    )}
                  />
                ))}
              </div>
            </div>
            {!editingStatusId && (
              <div className="space-y-2">
                <Label>Position</Label>
                <div className="flex gap-2">
                  <Button
                    variant={addStatusPosition === 'start' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setAddStatusPosition('start')}
                    className="flex-1"
                  >
                    Add to Start
                  </Button>
                  <Button
                    variant={addStatusPosition === 'end' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setAddStatusPosition('end')}
                    className="flex-1"
                  >
                    Add to End
                  </Button>
                </div>
              </div>
            )}
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => {
                setShowStatusDialog(false);
                setNewStatusName("");
                setNewStatusColor("bg-blue-500");
                setEditingStatusId(null);
              }}>
                Cancel
              </Button>
              {editingStatusId && (
                <Button
                  variant="destructive"
                  onClick={() => {
                    handleDeleteStatus(editingStatusId);
                    setShowStatusDialog(false);
                    setEditingStatusId(null);
                  }}
                >
                  Delete
                </Button>
              )}
              <Button
                onClick={handleSaveStatus}
                disabled={!newStatusName.trim()}
              >
                {editingStatusId ? "Save Changes" : "Add Status"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;
