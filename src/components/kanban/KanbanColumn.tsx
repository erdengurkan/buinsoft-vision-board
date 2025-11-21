import { useState, useRef, useEffect } from "react";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { ProjectCard } from "./ProjectCard";
import { Project, ProjectStatus } from "@/types";
import { cn } from "@/lib/utils";
import { getColorFromTailwind } from "@/utils/colorUtils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface KanbanColumnProps {
  status: string;
  statusId?: string;
  statusColor?: string;
  projects: Project[];
  onDeleteProject: (id: string) => void;
  onEditProject: (project: Project) => void;
  onQuickCreate?: (status: string, title: string) => void;
  onEditStatus?: (statusId: string) => void;
}

export const KanbanColumn = ({
  status,
  statusId,
  statusColor = "border-t-primary",
  projects,
  onDeleteProject,
  onEditProject,
  onQuickCreate,
  onEditStatus,
}: KanbanColumnProps) => {
  const { setNodeRef } = useDroppable({ id: status });
  const [showAddButton, setShowAddButton] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newProjectTitle, setNewProjectTitle] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isCreating && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isCreating]);

  const handleQuickCreate = () => {
    if (newProjectTitle.trim() && onQuickCreate) {
      onQuickCreate(status, newProjectTitle.trim());
      setNewProjectTitle("");
      setIsCreating(false);
    }
  };

  return (
    <div className="flex flex-col min-w-[320px] flex-1 h-full">
      <div
        className="mb-4 rounded-lg bg-card p-4 shrink-0"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">{status}</h2>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {projects.length}
            </span>
            {onEditStatus && statusId && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEditStatus(statusId)}>
                    Edit Status
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>
      <div
        ref={setNodeRef}
        className="flex-1 space-y-3 rounded-lg bg-muted/30 p-3 min-h-[200px] flex flex-col overflow-y-auto"
        onMouseEnter={() => setShowAddButton(true)}
        onMouseLeave={() => setShowAddButton(false)}
      >
        {projects.length > 0 ? (
          <SortableContext
            items={projects.map((p) => p.id)}
            strategy={verticalListSortingStrategy}
          >
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onDelete={onDeleteProject}
                onEdit={onEditProject}
              />
            ))}
          </SortableContext>
        ) : null}

        {/* Quick Add Button */}
        {(showAddButton || projects.length === 0) && !isCreating && (
          <button
            onClick={() => setIsCreating(true)}
            className="w-full py-2 flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-muted/50 rounded-md border-2 border-dashed border-transparent hover:border-primary/20 transition-all"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Project
          </button>
        )}

        {/* Inline Creation Form */}
        {isCreating && (
          <div className="bg-card p-3 rounded-lg shadow-sm border border-border animate-in fade-in zoom-in-95 duration-200">
            <Input
              ref={inputRef}
              placeholder="Project title..."
              value={newProjectTitle}
              onChange={(e) => setNewProjectTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleQuickCreate();
                } else if (e.key === "Escape") {
                  setIsCreating(false);
                  setNewProjectTitle("");
                }
              }}
              className="mb-2"
            />
            <div className="flex justify-end gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setIsCreating(false);
                  setNewProjectTitle("");
                }}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleQuickCreate}
              >
                Add
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
