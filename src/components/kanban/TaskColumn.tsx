import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { TaskCard } from "./TaskCard";
import { Task, TaskStatus } from "@/types";
import { cn } from "@/lib/utils";

interface TaskColumnProps {
  status: TaskStatus;
  tasks: Task[];
  onDeleteTask: (id: string) => void;
}

const statusColors: Record<TaskStatus, string> = {
  Todo: "border-t-blue-500",
  "In Progress": "border-t-yellow-500",
  Testing: "border-t-orange-500",
  Completed: "border-t-green-500",
};

export const TaskColumn = ({
  status,
  tasks,
  onDeleteTask,
}: TaskColumnProps) => {
  const { setNodeRef } = useDroppable({ id: status });

  return (
    <div className="flex flex-col min-w-[280px] flex-1">
      <div
        className={cn(
          "mb-4 rounded-lg border-t-4 bg-card p-3",
          statusColors[status]
        )}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">{status}</h3>
          <span className="text-xs text-muted-foreground">{tasks.length}</span>
        </div>
      </div>
      <div
        ref={setNodeRef}
        className="flex-1 space-y-2 rounded-lg bg-muted/30 p-2 min-h-[150px]"
      >
        <SortableContext
          items={tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} onDelete={onDeleteTask} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
};
