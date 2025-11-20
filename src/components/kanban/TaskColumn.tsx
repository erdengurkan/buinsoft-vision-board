import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { TaskCard } from "./TaskCard";
import { Task, TaskStatus } from "@/types";
import { cn } from "@/lib/utils";
import { getColorFromTailwind } from "@/utils/colorUtils";

interface TaskColumnProps {
  status: string;
  statusColor?: string;
  projectId: string;
  tasks: Task[];
  onDeleteTask: (id: string) => void;
  onViewTaskDetails?: (task: Task) => void;
}

export const TaskColumn = ({
  status,
  statusColor = "border-t-primary",
  projectId,
  tasks,
  onDeleteTask,
  onViewTaskDetails,
}: TaskColumnProps) => {
  const { setNodeRef } = useDroppable({ id: status });

  return (
    <div className="flex flex-col min-w-[280px] flex-1">
      <div
        className="mb-4 rounded-lg border-t-4 bg-card p-3"
        style={{ borderTopColor: statusColor ? getColorFromTailwind(statusColor) : undefined }}
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
        {tasks.length > 0 ? (
          <SortableContext
            items={tasks.map((t) => t.id)}
            strategy={verticalListSortingStrategy}
          >
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                projectId={projectId}
                onDelete={onDeleteTask}
                onViewDetails={onViewTaskDetails}
              />
            ))}
          </SortableContext>
        ) : (
          <div className="h-full min-h-[100px]" />
        )}
      </div>
    </div>
  );
};
