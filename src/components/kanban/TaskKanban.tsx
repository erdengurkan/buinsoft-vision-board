import { useState, useRef, useEffect } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  closestCenter,
  pointerWithin,
  rectIntersection,
  CollisionDetection,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { Task } from "@/types";
import { StatusColumn } from "@/types/workflow";
import { TaskColumn } from "./TaskColumn";
import { TaskCard } from "./TaskCard";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface TaskKanbanProps {
  projectId: string;
  tasks: Task[];
  statuses: StatusColumn[]; // Use StatusColumn instead of TaskStatus
  onUpdateTask: (taskId: string, updates: Partial<Task>, skipActivityLog?: boolean) => void;
  onReorderTasks?: (taskOrders: Array<{ id: string; order: number; status: string }>) => void;
  onDeleteTask: (taskId: string) => void;
  onViewTaskDetails?: (task: Task) => void;
  onEditTask?: (task: Task) => void;
  onCreateTask?: (status: string) => void;
  onQuickCreateTask?: (status: string, title: string, description?: string) => void;
  onAddStatus?: (position?: 'start' | 'end') => void;
  onDeleteStatus?: (statusId: string) => void;
  onEditStatus?: (statusId: string, newName: string, newColor: string) => void;
}

export const TaskKanban = ({
  projectId,
  tasks,
  statuses, // Destructure statuses
  onUpdateTask,
  onReorderTasks,
  onDeleteTask,
  onViewTaskDetails,
  onEditTask,
  onCreateTask,
  onQuickCreateTask,
  onAddStatus,
  onDeleteStatus,
  onEditStatus,
}: TaskKanbanProps) => {
  // Remove useWorkflow hook usage
  const taskStatuses = statuses;
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Mouse drag-to-scroll functionality
  const handleMouseDown = (e: React.MouseEvent) => {
    // Only start drag-to-scroll if clicking on empty space (not on a task or interactive element)
    const target = e.target as HTMLElement;
    // Check if clicking on interactive elements
    if (
      target.closest('[role="button"]') ||
      target.closest('button') ||
      target.closest('a') ||
      target.closest('[data-dnd-kit-drag-handle]') ||
      target.closest('[data-dnd-kit-sortable]')
    ) {
      return;
    }

    setIsDragging(true);
    const container = scrollContainerRef.current;
    if (container) {
      setStartX(e.pageX - container.offsetLeft);
      setScrollLeft(container.scrollLeft);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX - (scrollContainerRef.current.offsetLeft || 0);
    const walk = (x - startX) * 2; // Scroll speed multiplier
    scrollContainerRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    if (isDragging) {
      container.style.cursor = 'grabbing';
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'grabbing';
    } else {
      container.style.cursor = 'grab';
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    }

    return () => {
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, [isDragging]);

  // Custom collision detection for better precision - uses pointer position
  const collisionDetection: CollisionDetection = (args) => {
    // First check if pointer is within any droppable area
    const pointerCollisions = pointerWithin(args);

    if (pointerCollisions.length > 0) {
      // If pointer is within a droppable, use closest center for precise positioning
      return closestCenter({
        ...args,
        droppableContainers: args.droppableContainers.filter((container) =>
          pointerCollisions.some((collision) => collision.id === container.id)
        ),
      });
    }

    // Fallback to rect intersection
    return rectIntersection(args);
  };

  const handleDragStart = (event: any) => {
    const task = tasks.find((t) => t.id === event.active.id);
    if (task) {
      setActiveTask(task);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;

    if (!over) return;

    const taskId = active.id as string;
    const overId = over.id as string;

    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    // Check if over a task or status column
    const overTask = tasks.find((t) => t.id === overId);
    const isOverStatus = taskStatuses.some((s) => s.name === overId);

    // Visual feedback is handled by @dnd-kit automatically
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      setActiveTask(null);
      return;
    }

    const taskId = active.id as string;
    const overId = over.id as string;

    // Find the dragged task
    const task = tasks.find((t) => t.id === taskId);
    if (!task) {
      setActiveTask(null);
      return;
    }

    // Check if dropping on a status column (droppable area)
    const isOverStatus = taskStatuses.some((s) => s.name === overId);

    // Check if dropping on another task
    const overTask = tasks.find((t) => t.id === overId);

    if (isOverStatus) {
      // Moving to a different status column (dropped on empty area of column)
      const newStatus = overId as string;
      if (task.status !== newStatus) {
        // Calculate order for the new status (append to end)
        const newStatusTasks = tasks.filter((t) => t.status === newStatus);
        const maxOrder = newStatusTasks.length > 0
          ? Math.max(...newStatusTasks.map((t) => (t as any).order ?? 0))
          : -1;
        const newOrder = maxOrder + 1;

        onUpdateTask(taskId, { status: newStatus, order: newOrder }, false);
      }
    } else if (overTask) {
      // Dropping on another task
      if (task.status === overTask.status) {
        // Reordering within the same status
        const statusTasks = tasks
          .filter((t) => t.status === task.status)
          .sort((a, b) => {
            const aOrder = (a as any).order ?? 0;
            const bOrder = (b as any).order ?? 0;
            return aOrder - bOrder;
          });

        const oldIndex = statusTasks.findIndex((t) => t.id === taskId);
        const newIndex = statusTasks.findIndex((t) => t.id === overId);

        if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
          // Use arrayMove to get the correct reordered array
          const reordered = arrayMove(statusTasks, oldIndex, newIndex);

          // Use batch reorder endpoint if available (prevents race conditions)
          if (onReorderTasks) {
            const taskOrders = reordered.map((t, index) => ({
              id: t.id,
              order: index,
              status: task.status,
            }));
            onReorderTasks(taskOrders);
          } else {
            // Fallback: individual updates
            const updates: Array<{ taskId: string; order: number }> = [];
            reordered.forEach((t, index) => {
              const originalIndex = statusTasks.findIndex((orig) => orig.id === t.id);
              if (originalIndex !== index) {
                updates.push({ taskId: t.id, order: index });
              }
            });

            // Apply updates sequentially with small delays to prevent race conditions
            updates.forEach((update, idx) => {
              setTimeout(() => {
                // CRITICAL: Explicitly include status to prevent backend from resetting it
                onUpdateTask(update.taskId, {
                  order: update.order,
                  status: task.status, // Use the current task's status (same for all in this status)
                }, true);
              }, idx * 50); // Small delay between updates
            });
          }
        }
      } else {
        // Moving to different status (dropped on task in different column)
        const newStatus = overTask.status;
        const newStatusTasks = tasks
          .filter((t) => t.status === newStatus)
          .sort((a, b) => {
            const aOrder = (a as any).order ?? 0;
            const bOrder = (b as any).order ?? 0;
            return aOrder - bOrder;
          });

        const targetIndex = newStatusTasks.findIndex((t) => t.id === overId);

        if (targetIndex !== -1) {
          // First, update the dragged task's status and order
          onUpdateTask(taskId, { status: newStatus, order: targetIndex }, false);

          // Then, update orders for tasks that come after the target position
          // Batch updates to prevent race conditions
          const updates: Array<{ taskId: string; order: number }> = [];
          newStatusTasks.forEach((t, index) => {
            if (index >= targetIndex && t.id !== taskId) {
              updates.push({ taskId: t.id, order: index + 1 });
            }
          });

          // Apply updates sequentially with small delays
          updates.forEach((update, idx) => {
            setTimeout(() => {
              // CRITICAL: Always include status to prevent it from being lost
              onUpdateTask(update.taskId, {
                order: update.order,
                status: newStatus, // All tasks in this status have the same status
              }, true);
            }, (idx + 1) * 50); // Delay after the dragged task update
          });
        } else {
          // Fallback: just change status if target not found
          // Calculate order for the new status (append to end)
          const newStatusTasks = tasks.filter((t) => t.status === newStatus);
          const maxOrder = newStatusTasks.length > 0
            ? Math.max(...newStatusTasks.map((t) => (t as any).order ?? 0))
            : -1;
          const newOrder = maxOrder + 1;

          onUpdateTask(taskId, { status: newStatus, order: newOrder }, false);
        }
      }
    }

    setActiveTask(null);
  };

  const getTasksByStatus = (statusName: string) => {
    const statusTasks = tasks.filter((task) => task.status === statusName);
    // Sort by order if available, otherwise maintain current order
    return statusTasks.sort((a, b) => {
      const aOrder = (a as any).order ?? 999;
      const bOrder = (b as any).order ?? 999;
      if (aOrder === bOrder) {
        // If orders are equal, maintain original order
        return tasks.indexOf(a) - tasks.indexOf(b);
      }
      return aOrder - bOrder;
    });
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div
        ref={scrollContainerRef}
        className="kanban-scroll-container flex gap-2 md:gap-4 overflow-x-auto pb-4 cursor-grab h-full"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        {/* Add Status Button - Only show before first status */}
        {onAddStatus && (
          <div className="flex items-start pt-12 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onAddStatus('start')}
              className="h-8 w-8 p-0 rounded-full border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/50"
              title="Add new status at start"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        )}

        {taskStatuses.map((status, index) => {
          const statusTasks = getTasksByStatus(status.name);
          return (
            <div key={status.id} className="flex items-start gap-2 shrink-0">
              <TaskColumn
                status={status.name}
                statusColor={status.color}
                statusId={status.id}
                projectId={projectId}
                tasks={statusTasks}
                onDeleteTask={onDeleteTask}
                onViewTaskDetails={onViewTaskDetails}
                onEditTask={onEditTask}
                onCreateTask={onCreateTask}
                onQuickCreateTask={onQuickCreateTask}
                onDeleteStatus={statusTasks.length === 0 && onDeleteStatus ? () => onDeleteStatus(status.id) : undefined}
                onEditStatus={onEditStatus}
              />
              {/* Add Status Button after each column */}
              {onAddStatus && index === taskStatuses.length - 1 && (
                <div className="flex items-start pt-12">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onAddStatus('end')}
                    className="h-8 w-8 p-0 rounded-full border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/50"
                    title="Add new status at end"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <DragOverlay>
        {activeTask ? <TaskCard task={activeTask} projectId={projectId} onDelete={() => { }} /> : null}
      </DragOverlay>
    </DndContext>
  );
};
