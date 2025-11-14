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

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      setActiveTask(null);
      return;
    }

    const taskId = active.id as string;
    const newStatus = over.id as string;

    const statusExists = taskStatuses.some((s) => s.name === newStatus);
    if (statusExists) {
      const task = tasks.find((t) => t.id === taskId);
      if (task && task.status !== newStatus) {
        onUpdateTask(taskId, { status: newStatus });
      }
    }

    setActiveTask(null);
  };

  const getTasksByStatus = (statusName: string) => {
    return tasks.filter((task) => task.status === statusName);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
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
