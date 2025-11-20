import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { TaskCard } from "./TaskCard";
import { Task, TaskStatus } from "@/types";
import { cn } from "@/lib/utils";
import { getColorFromTailwind } from "@/utils/colorUtils";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useState } from "react";

interface TaskColumnProps {
  status: string;
  statusColor?: string;
  projectId: string;
  tasks: Task[];
  onDeleteTask: (id: string) => void;
  onViewTaskDetails?: (task: Task) => void;
  onCreateTask?: (status: string) => void;
}

export const TaskColumn = ({
  status,
  statusColor = "border-t-primary",
  projectId,
  tasks,
  onDeleteTask,
  onViewTaskDetails,
  onCreateTask,
}: TaskColumnProps) => {
  const { setNodeRef } = useDroppable({ id: status });
  const [showAddButton, setShowAddButton] = useState(false);

  return (
    <div className="flex flex-col min-w-[260px] sm:min-w-[280px] flex-1 shrink-0 h-full">
      <div
        className="mb-4 rounded-lg border-t-4 bg-card p-2 sm:p-3 shrink-0"
        style={{ borderTopColor: statusColor ? getColorFromTailwind(statusColor) : undefined }}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-xs sm:text-sm font-semibold text-foreground truncate">{status}</h3>
          <span className="text-xs text-muted-foreground ml-2">{tasks.length}</span>
        </div>
      </div>
      <div
        ref={setNodeRef}
        className="flex-1 space-y-2 rounded-lg bg-muted/30 p-1.5 sm:p-2 min-h-0 flex flex-col overflow-y-auto"
        onMouseEnter={() => setShowAddButton(true)}
        onMouseLeave={() => setShowAddButton(false)}
      >
        <div className="flex-1 space-y-2">
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
        
        {/* Add Here Button */}
        {(showAddButton || tasks.length === 0) && onCreateTask && (
          <div className="pt-2 shrink-0">
            <Button
              variant="ghost"
              className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-muted/50 border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 transition-all"
              onClick={() => onCreateTask(status)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Here
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
