import { useState, useRef, useEffect, useCallback } from "react";
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
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { Task } from "@/types";
import { StatusColumn } from "@/types/workflow";
import { TaskColumn } from "./TaskColumn";
import { TaskCard } from "./TaskCard";
import { Button } from "@/components/ui/button";
import { Plus, ZoomIn, ZoomOut, Maximize2, Lock, Unlock } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

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
  const isMobile = useIsMobile();
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const kanbanContentRef = useRef<HTMLDivElement>(null);
  
  // Zoom and Pan states
  const [zoom, setZoom] = useState(0.75); // Default zoom at 75%
  const [pan, setPan] = useState({ x: 20, y: 20 }); // Default offset for better initial view
  const [isLocked, setIsLocked] = useState(false);
  
  // Drag-to-pan states
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Mobile pinch-to-zoom states
  const [touchStartDistance, setTouchStartDistance] = useState<number | null>(null);
  const touchStartZoomRef = useRef(0.75);
  
  // Use refs for zoom to avoid re-renders in touch handlers
  const zoomRef = useRef(zoom);
  
  // Update zoomRef when zoom changes
  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 5,
      },
    })
  );

  // Mouse drag-to-pan functionality (desktop only)
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isMobile) return;
    
    // Only start drag-to-pan if clicking on empty space (not on a task or interactive element)
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

    if (isLocked) return;

    setIsDragging(true);
    setStartPos({ x: e.pageX, y: e.pageY });
    setPanStart(pan);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || isLocked || isMobile) return;
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

  // Mobile touch pinch-to-zoom handlers
  // Mobile touch pinch-to-zoom handlers - use useCallback and refs to prevent re-renders
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!isMobile || isLocked) return;
    
    if (e.touches.length === 2) {
      const distance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      setTouchStartDistance(distance);
      touchStartZoomRef.current = zoomRef.current; // Use ref instead of state
      e.preventDefault(); // Prevent browser zoom
    }
  }, [isMobile, isLocked]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isMobile || isLocked) return;
    
    if (e.touches.length === 2 && touchStartDistance !== null) {
      const distance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const scale = distance / touchStartDistance;
      const newZoom = Math.max(0.5, Math.min(2.0, touchStartZoomRef.current * scale));
      setZoom(newZoom);
      e.preventDefault(); // Prevent browser zoom
    }
  }, [isMobile, isLocked, touchStartDistance]);

  const handleTouchEnd = useCallback(() => {
    if (!isMobile) return;
    setTouchStartDistance(null);
  }, [isMobile]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    if (isDragging) {
      container.style.cursor = 'grabbing';
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'grabbing';
    } else {
      container.style.cursor = isLocked ? 'default' : 'grab';
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    }

    return () => {
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, [isDragging, isLocked]);

  // Mouse wheel zoom handler (desktop only) - using native event listener to avoid passive listener issue
  // Use useRef to store the latest values without causing re-renders
  const isMobileRef = useRef(isMobile);
  const isLockedRef = useRef(isLocked);
  
  // Update refs when values change (without triggering useEffect)
  useEffect(() => {
    isMobileRef.current = isMobile;
    isLockedRef.current = isLocked;
  }, [isMobile, isLocked]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    // Wheel handler for zoom and pan - check refs instead of props to avoid re-renders
    const handleWheel = (e: WheelEvent) => {
      // Skip if mobile or locked (check refs to avoid closure issues)
      if (isMobileRef.current || isLockedRef.current) return;

      // MacBook trackpad pinch gesture (Ctrl/Cmd + wheel = zoom)
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.015 : 0.015; // Slower zoom (half of 0.03)
        setZoom((prevZoom) => {
          const newZoom = Math.max(0.5, Math.min(2.0, prevZoom + delta));
          return newZoom;
        });
        return;
      }
      
      // Two-finger swipe on MacBook (deltaX) should pan, not zoom
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        // Horizontal scroll = pan - prevent browser back/forward navigation via CSS overscroll-behavior
        e.preventDefault();
        e.stopPropagation();
        setPan((prevPan) => ({
          x: prevPan.x + e.deltaX,
          y: prevPan.y,
        }));
        return;
      }
      
      // Only zoom if it's a vertical scroll (deltaY) without Ctrl/Cmd
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        // Vertical scroll = zoom
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.015 : 0.015; // Slower zoom (half of 0.03)
        setZoom((prevZoom) => {
          const newZoom = Math.max(0.5, Math.min(2.0, prevZoom + delta));
          return newZoom;
        });
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    
    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, []); // Empty dependency array - only run once on mount

  // Zoom control handlers
  const handleZoomIn = () => {
    if (isLocked) return;
    setZoom((prev) => Math.min(2.0, prev + 0.025)); // Slower zoom (half of 0.05)
  };

  const handleZoomOut = () => {
    if (isLocked) return;
    setZoom((prev) => Math.max(0.5, prev - 0.025)); // Slower zoom (half of 0.05)
  };

  const handleFitView = () => {
    if (isLocked) return;
    setZoom(0.75);
    setPan({ x: 20, y: 20 }); // Reset to default offset
  };

  const handleResetView = () => {
    if (isLocked) return;
    setZoom(1.0);
    setPan({ x: 0, y: 0 });
  };

  const handleToggleLock = () => {
    setIsLocked((prev) => !prev);
    if (!isLocked) {
      setIsDragging(false);
    }
  };

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
        className={cn(
          "kanban-scroll-container relative h-full w-full",
          isMobile 
            ? "overflow-x-auto overflow-y-hidden" 
            : "overflow-hidden"
        )}
        style={{
          ...(isMobile && {
            WebkitOverflowScrolling: 'touch' as const,
            scrollbarWidth: 'thin' as const,
          }),
          ...(!isMobile && {
            cursor: isLocked ? 'default' : isDragging ? 'grabbing' : 'grab'
          }),
          // Disable browser back/forward navigation on swipe (MacBook trackpad)
          overscrollBehaviorX: 'none' as const,
          overscrollBehaviorY: 'none' as const,
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          ref={kanbanContentRef}
          className="flex gap-2 md:gap-4 pb-4"
          style={{
            ...(!isMobile && {
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: 'top left',
              transition: isDragging ? 'none' : 'transform 0.1s ease-out',
            }),
            ...(isMobile && {
              minWidth: 'max-content',
            }),
          }}
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
                onUpdateTask={onUpdateTask}
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
        
        {/* Zoom Controls - Bottom Left (Desktop) / Bottom Right (Mobile) */}
        {!isMobile && (
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
        )}
      </div>
      <DragOverlay>
        {activeTask ? <TaskCard task={activeTask} projectId={projectId} onDelete={() => { }} /> : null}
      </DragOverlay>
    </DndContext>
  );
};
