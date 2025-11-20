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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, X, Check, Trash2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";

interface TaskColumnProps {
  status: string;
  statusColor?: string;
  projectId: string;
  tasks: Task[];
  onDeleteTask: (id: string) => void;
  onViewTaskDetails?: (task: Task) => void;
  onCreateTask?: (status: string) => void;
  onQuickCreateTask?: (status: string, title: string, description?: string) => void;
  onDeleteStatus?: () => void;
}

export const TaskColumn = ({
  status,
  statusColor = "border-t-primary",
  projectId,
  tasks,
  onDeleteTask,
  onViewTaskDetails,
  onCreateTask,
  onQuickCreateTask,
  onDeleteStatus,
}: TaskColumnProps) => {
  const { setNodeRef } = useDroppable({ id: status });
  const [showAddButton, setShowAddButton] = useState(false);
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isCreatingTask && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isCreatingTask]);

  return (
    <div className="flex flex-col min-w-[260px] sm:min-w-[280px] flex-1 shrink-0 h-full">
      <div
        className="mb-4 rounded-lg border-t-4 bg-card p-2 sm:p-3 shrink-0"
        style={{ borderTopColor: statusColor ? getColorFromTailwind(statusColor) : undefined }}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-xs sm:text-sm font-semibold text-foreground truncate">{status}</h3>
          {tasks.length === 0 && onDeleteStatus ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteStatus();
              }}
              className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
              title="Delete status"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          ) : (
            <span className="text-xs text-muted-foreground ml-2">{tasks.length}</span>
          )}
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
          ) : null}
          
          {/* Add Here Button or Inline Task Creation */}
          {(showAddButton || tasks.length === 0) && !isCreatingTask && onCreateTask && (
            <div className="shrink-0">
              <Button
                variant="ghost"
                className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-muted/50 border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 transition-all"
                onClick={() => {
                  setIsCreatingTask(true);
                  setNewTaskTitle("");
                  setNewTaskDescription("");
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Here
              </Button>
            </div>
          )}
          
          {/* Inline Task Creation Form */}
          {isCreatingTask && (
            <div className="shrink-0 rounded-lg border bg-card p-3 shadow-sm">
              <Input
                ref={inputRef}
                placeholder="Enter task title..."
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.ctrlKey || e.metaKey) && newTaskTitle.trim()) {
                    // Ctrl/Cmd + Enter to submit
                    if (onQuickCreateTask) {
                      onQuickCreateTask(status, newTaskTitle.trim(), newTaskDescription.trim());
                    }
                    setIsCreatingTask(false);
                    setNewTaskTitle("");
                    setNewTaskDescription("");
                  } else if (e.key === "Escape") {
                    setIsCreatingTask(false);
                    setNewTaskTitle("");
                    setNewTaskDescription("");
                  }
                }}
                className="mb-2"
              />
              <Textarea
                placeholder="Enter description (optional)..."
                value={newTaskDescription}
                onChange={(e) => setNewTaskDescription(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.ctrlKey || e.metaKey) && newTaskTitle.trim()) {
                    // Ctrl/Cmd + Enter to submit
                    e.preventDefault();
                    if (onQuickCreateTask) {
                      onQuickCreateTask(status, newTaskTitle.trim(), newTaskDescription.trim());
                    }
                    setIsCreatingTask(false);
                    setNewTaskTitle("");
                    setNewTaskDescription("");
                  } else if (e.key === "Escape") {
                    setIsCreatingTask(false);
                    setNewTaskTitle("");
                    setNewTaskDescription("");
                  }
                }}
                className="mb-2 min-h-[60px] resize-none"
                rows={2}
              />
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => {
                    if (newTaskTitle.trim() && onQuickCreateTask) {
                      onQuickCreateTask(status, newTaskTitle.trim(), newTaskDescription.trim());
                    }
                    setIsCreatingTask(false);
                    setNewTaskTitle("");
                    setNewTaskDescription("");
                  }}
                  disabled={!newTaskTitle.trim()}
                >
                  <Check className="h-4 w-4 mr-1" />
                  Add
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setIsCreatingTask(false);
                    setNewTaskTitle("");
                    setNewTaskDescription("");
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
