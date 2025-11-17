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
import { Task, TaskStatus } from "@/types";
import { TaskColumn } from "./TaskColumn";
import { TaskCard } from "./TaskCard";
import { useWorkflow } from "@/contexts/WorkflowContext";

interface TaskKanbanProps {
  tasks: Task[];
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
  onDeleteTask: (taskId: string) => void;
  onViewTaskDetails?: (task: Task) => void;
}

export const TaskKanban = ({
  tasks,
  onUpdateTask,
  onDeleteTask,
  onViewTaskDetails,
}: TaskKanbanProps) => {
  const { taskStatuses } = useWorkflow();
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

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
        onUpdateTask(taskId, { status: newStatus, order: 0 });
      }
    } else if (overTask) {
      // Dropping on another task - check if same status or different
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
          
          // Update order for all tasks in this status based on new positions
          reordered.forEach((t, index) => {
            onUpdateTask(t.id, { order: index });
          });
        }
      } else {
        // Moving to different status (dropped on task in different column)
        const newStatusTasks = tasks
          .filter((t) => t.status === overTask.status)
          .sort((a, b) => {
            const aOrder = (a as any).order ?? 0;
            const bOrder = (b as any).order ?? 0;
            return aOrder - bOrder;
          });
        
        const targetIndex = newStatusTasks.findIndex((t) => t.id === overId);
        
        if (targetIndex !== -1) {
          // Move task to new status first
          onUpdateTask(taskId, { status: overTask.status });
          
          // Then reorder: insert dragged task at target position
          // All tasks from targetIndex onwards get their order incremented
          newStatusTasks.forEach((t, index) => {
            if (index >= targetIndex) {
              onUpdateTask(t.id, { order: index + 1 });
            }
          });
          
          // Set dragged task's order to targetIndex
          onUpdateTask(taskId, { order: targetIndex });
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
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {taskStatuses.map((status) => (
          <TaskColumn
            key={status.id}
            status={status.name}
            statusColor={status.color}
            tasks={getTasksByStatus(status.name)}
            onDeleteTask={onDeleteTask}
            onViewTaskDetails={onViewTaskDetails}
          />
        ))}
      </div>
      <DragOverlay>
        {activeTask ? <TaskCard task={activeTask} onDelete={() => {}} /> : null}
      </DragOverlay>
    </DndContext>
  );
};
