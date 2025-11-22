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
import { Plus, Trash2 } from "lucide-react";

interface KanbanColumnProps {
  status: string;
  statusId?: string;
  statusColor?: string;
  projects: Project[];
  onDeleteProject: (id: string) => void;
  onEditProject: (project: Project) => void;
  onUpdateProject?: (projectId: string, updates: Partial<Project>) => void;
  onQuickCreate?: (status: string, title: string) => void;
  onEditStatus?: (statusId: string, newName: string, newColor: string) => void;
  onDeleteStatus?: () => void;
}

export const KanbanColumn = ({
  status,
  statusId,
  statusColor = "border-t-primary",
  projects,
  onDeleteProject,
  onEditProject,
  onUpdateProject,
  onQuickCreate,
  onEditStatus,
  onDeleteStatus,
}: KanbanColumnProps) => {
  const { setNodeRef } = useDroppable({ id: status });
  const [showAddButton, setShowAddButton] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newProjectTitle, setNewProjectTitle] = useState("");
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [editedStatusName, setEditedStatusName] = useState(status);
  const [editedStatusColor, setEditedStatusColor] = useState(statusColor || "bg-blue-500");
  const inputRef = useRef<HTMLInputElement>(null);
  const statusInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isCreating && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isCreating]);

  useEffect(() => {
    if (isEditingStatus && statusInputRef.current) {
      statusInputRef.current.focus();
      statusInputRef.current.select();
    }
  }, [isEditingStatus]);

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
        className="mb-4 rounded-lg border-t-4 bg-card p-2 sm:p-3 shrink-0"
        style={{ borderTopColor: statusColor ? getColorFromTailwind(statusColor) : undefined }}
      >
        <div className="flex items-center justify-between gap-2">
          {isEditingStatus && onEditStatus && statusId ? (
            <div className="flex items-center gap-2 flex-1">
              <Input
                ref={statusInputRef}
                type="text"
                value={editedStatusName}
                onChange={(e) => setEditedStatusName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    onEditStatus(statusId, editedStatusName, editedStatusColor);
                    setIsEditingStatus(false);
                  } else if (e.key === 'Escape') {
                    setEditedStatusName(status);
                    setIsEditingStatus(false);
                  }
                }}
                className="h-7 text-sm font-semibold"
                onBlur={() => {
                  onEditStatus(statusId, editedStatusName, editedStatusColor);
                  setIsEditingStatus(false);
                }}
              />
            </div>
          ) : (
            <h2 
              className="text-xs sm:text-sm font-semibold text-foreground truncate cursor-pointer hover:opacity-70 transition-opacity flex-1"
              onDoubleClick={() => {
                if (onEditStatus && statusId) {
                  setIsEditingStatus(true);
                  setEditedStatusName(status);
                  setEditedStatusColor(statusColor || "bg-blue-500");
                }
              }}
              title={onEditStatus ? "Double-click to edit" : undefined}
            >
              {status}
            </h2>
          )}
          {!isEditingStatus && (
            <>
              {projects.length === 0 && onDeleteStatus ? (
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
                <span className="text-xs text-muted-foreground ml-2">{projects.length}</span>
              )}
            </>
          )}
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
                onUpdateProject={onUpdateProject}
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
