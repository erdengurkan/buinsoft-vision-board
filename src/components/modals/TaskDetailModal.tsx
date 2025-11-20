import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Task, Priority } from "@/types";
import { TaskWorklog } from "@/components/tasks/TaskWorklog";
import { Comments } from "@/components/comments/Comments";
import { useWorklog } from "@/hooks/useWorklog";
import { useComments } from "@/hooks/useComments";
import { useActivityLog } from "@/hooks/useActivityLog";
import { useTaskTimer } from "@/contexts/TaskTimerContext";
import { useApp } from "@/contexts/AppContext";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { User, Flag, Workflow, Edit2, Check, X, CalendarIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { RichTextEditor } from "@/components/editor/RichTextEditor";
import { toast } from "sonner";
import { teamMembers } from "@/data/mockData";
import { useWorkflow } from "@/contexts/WorkflowContext";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const API_URL = import.meta.env.VITE_API_URL || "/api";

interface TaskDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task | null;
  projectTitle?: string;
}

const priorityColors: Record<Priority, string> = {
  Low: "bg-priority-low text-white",
  Medium: "bg-priority-medium text-white",
  High: "bg-priority-high text-white",
  Critical: "bg-red-900 text-white",
};

export const TaskDetailModal = ({
  open,
  onOpenChange,
  task,
  projectTitle,
}: TaskDetailModalProps) => {
  const navigate = useNavigate();
  const { getTaskWorklog, addWorklogEntry, deleteWorklogEntry } = useWorklog();
  const { projects } = useApp();
  const project = task ? projects.find((p) => p.tasks.some((t) => t.id === task.id)) : undefined;
  const { addComment, deleteComment, getTaskComments } = useComments(project?.id);
  const { logActivity } = useActivityLog(project?.id);
  const { activeTimer, stopTimer } = useTaskTimer();
  const { taskStatuses } = useWorkflow();
  const queryClient = useQueryClient();

  // Task mutation - MUST be before conditional returns (Rules of Hooks)
  const updateTaskMutation = useMutation({
    mutationFn: async ({ taskId, updates }: { taskId: string; updates: Partial<Task> }) => {
      const res = await fetch(`${API_URL}/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error("Failed to update task");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });

  const [isEditing, setIsEditing] = useState(false);
  const [deadlinePopoverOpen, setDeadlinePopoverOpen] = useState(false);
  const [showUnsavedChangesDialog, setShowUnsavedChangesDialog] = useState(false);
  const [pendingClose, setPendingClose] = useState(false);
  const [initialFormData, setInitialFormData] = useState<Partial<Task>>({});
  const [formData, setFormData] = useState<Partial<Task>>({
    title: "",
    description: "",
    assignee: "",
    priority: "Medium" as Priority,
    status: "Todo",
    deadline: undefined,
  });

  useEffect(() => {
    if (task) {
      const initialData = {
        title: task.title,
        description: task.description || "",
        assignee: task.assignee,
        priority: task.priority,
        status: task.status,
        deadline: task.deadline,
        followUp: task.followUp,
      };
      setInitialFormData(initialData);
      setFormData(initialData);
      // Open in edit mode when modal opens
      setIsEditing(true);
    }
  }, [task, open]);

  if (!task) return null;

  // Get worklog from task directly (from backend) or from useWorklog hook
  const taskWorklogFromHook = getTaskWorklog(task.id);
  const taskWorklog = task.worklog && task.worklog.length > 0 ? task.worklog : taskWorklogFromHook;
  const taskComments = getTaskComments(task.id);

  const handleOpenFlow = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (project) {
      navigate(`/project/${project.id}/task/${task.id}/flow`);
      onOpenChange(false);
    }
  };

  const handleSave = async () => {
    if (!project) return;

    if (!formData.title?.trim()) {
      toast.error("Title cannot be empty");
      return;
    }

    try {
      await updateTaskMutation.mutateAsync({
        taskId: task.id,
        updates: formData,
      });

      logActivity(
        project.id,
        "task_edited",
        `Task "${formData.title}" updated`,
        { taskId: task.id }
      );

      setIsEditing(false);
      toast.success("Task updated");
    } catch (error) {
      toast.error("Failed to update task");
    }
  };

  const handleCancel = () => {
    setFormData(initialFormData);
    setIsEditing(false);
  };

  // Check if form data has changed
  const hasChanges = () => {
    if (!task) return false;
    return (
      formData.title !== initialFormData.title ||
      formData.description !== initialFormData.description ||
      formData.assignee !== initialFormData.assignee ||
      formData.priority !== initialFormData.priority ||
      formData.status !== initialFormData.status ||
      formData.deadline?.getTime() !== initialFormData.deadline?.getTime() ||
      formData.followUp !== initialFormData.followUp
    );
  };

  const handleCloseRequest = () => {
    if (isEditing && hasChanges()) {
      // Show custom confirmation dialog
      setShowUnsavedChangesDialog(true);
      setPendingClose(true);
    } else {
      // No changes, close immediately
      handleCancel();
      onOpenChange(false);
    }
  };

  const handleDialogOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // If unsaved changes dialog is open, close it first
      if (showUnsavedChangesDialog) {
        setShowUnsavedChangesDialog(false);
        setPendingClose(false);
        return;
      }
      // Otherwise, check for unsaved changes
      handleCloseRequest();
    } else {
      onOpenChange(newOpen);
    }
  };

  const handleSaveAndClose = async () => {
    await handleSave();
    setShowUnsavedChangesDialog(false);
    setPendingClose(false);
    onOpenChange(false);
  };

  const handleDiscardAndClose = () => {
    handleCancel();
    setShowUnsavedChangesDialog(false);
    setPendingClose(false);
    onOpenChange(false);
  };

  const handleCancelUnsavedDialog = () => {
    setShowUnsavedChangesDialog(false);
    setPendingClose(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent 
        className="max-w-6xl max-h-[90vh] overflow-y-auto" 
        onInteractOutside={(e) => {
          if (isEditing && hasChanges()) {
            e.preventDefault();
            handleCloseRequest();
          }
        }}
        onEscapeKeyDown={(e) => {
          if (isEditing && hasChanges()) {
            e.preventDefault();
            handleCloseRequest();
          }
        }}
      >
        <DialogHeader>
          <DialogDescription className="text-sm text-muted-foreground">
            {projectTitle ? `Project: ${projectTitle}` : "Task details"}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-6">
          {/* Left Column: Task Info, Title, Description */}
          <div className="col-span-2 space-y-6">
            {/* Task Info - Moved to top */}
            <div className="grid grid-cols-2 gap-4 p-4 border border-border rounded-lg">
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Status</Label>
                {isEditing ? (
                  <Select 
                    value={formData.status} 
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {taskStatuses.map((status) => (
                        <SelectItem key={status.id} value={status.name}>
                          {status.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge variant="outline">{task.status}</Badge>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Priority</Label>
                {isEditing ? (
                  <Select 
                    value={formData.priority} 
                    onValueChange={(value) => setFormData({ ...formData, priority: value as Priority })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Low">Low</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="High">High</SelectItem>
                      <SelectItem value="Critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge className={cn("px-2 py-0.5", priorityColors[task.priority])}>{task.priority}</Badge>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Assignee</Label>
                {isEditing ? (
                  <Select 
                    value={formData.assignee} 
                    onValueChange={(value) => setFormData({ ...formData, assignee: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select assignee" />
                    </SelectTrigger>
                    <SelectContent>
                      {teamMembers.map((member) => (
                        <SelectItem key={member.id} value={member.name}>
                          {member.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>{task.assignee}</span>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Deadline</Label>
                {isEditing ? (
                  <Popover open={deadlinePopoverOpen} onOpenChange={setDeadlinePopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-full justify-start text-left font-normal")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.deadline ? format(formData.deadline, "PPP") : <span>Optional</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.deadline}
                        onSelect={(date) => {
                          setFormData({ ...formData, deadline: date });
                          setDeadlinePopoverOpen(false); // Close popover when date is selected
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                ) : (
                  task.deadline ? (
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4" />
                      <span>{format(task.deadline, "MMM d, yyyy")}</span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-sm">No deadline</span>
                  )
                )}
              </div>
              {task.followUp && !isEditing && (
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Follow-up</div>
                  <div className="flex items-center gap-2">
                    <Flag className="h-4 w-4 text-orange-500" />
                    <span className="text-orange-600 dark:text-orange-400">Required</span>
                  </div>
                </div>
              )}
            </div>

            {/* Title - Moved above Description */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Title</Label>
              {isEditing ? (
                <Input
                  value={formData.title || ""}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="text-xl font-semibold"
                  placeholder="Task title"
                />
              ) : (
                <div className="text-xl font-semibold flex items-center gap-2">
                  {task.title}
                  {task.flowDiagram && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            onClick={handleOpenFlow}
                            className="inline-flex items-center rounded-md border border-input bg-background px-2 py-0.5 text-xs font-semibold transition-colors hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer"
                          >
                            <Workflow className="h-3 w-3 mr-1" />
                            Flow
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>This task has a flow diagram. Click to edit.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Description</Label>
              {isEditing ? (
                <RichTextEditor
                  content={formData.description || ""}
                  onChange={(html) => setFormData({ ...formData, description: html })}
                  placeholder="Add a description..."
                  className="min-h-[200px]"
                />
              ) : (
                <div
                  className="text-sm text-muted-foreground p-3 bg-muted/30 rounded-lg min-h-[60px] prose prose-sm max-w-none prose-p:my-1 prose-p:first:mt-0 prose-p:last:mb-0 prose-headings:my-2 prose-headings:first:mt-0 prose-ul:my-2 prose-ol:my-2 prose-li:my-0"
                  dangerouslySetInnerHTML={{
                    __html: task.description || "<p class='text-muted-foreground italic'>No description</p>",
                  }}
                />
              )}
            </div>

          </div>

          {/* Right Column: Comments */}
          <div className="col-span-1">
            {project && (
              <Comments
                projectId={project.id}
                taskId={task.id}
                comments={taskComments}
                onAddComment={(text) => {
                  addComment(project.id, task.id, text);
                  logActivity(
                    project.id,
                    "task_edited",
                    `Comment added on task "${task.title}"`,
                    { taskId: task.id }
                  );
                }}
                onDeleteComment={deleteComment}
              />
            )}
          </div>
        </div>

        {/* Bottom Bar: Cancel/Save buttons on left, Timer on right */}
        <div className="flex items-center justify-between pt-4 mt-4 border-t border-border">
          {/* Left: Cancel and Save Changes buttons */}
          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <Button variant="outline" onClick={handleCloseRequest}>
                  Cancel
                </Button>
                <Button onClick={handleSave}>
                  Save Changes
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => setIsEditing(true)} className="gap-2">
                  <Edit2 className="h-4 w-4" />
                  Edit Task
                </Button>
                {task.flowDiagram && (
                  <Button variant="outline" onClick={handleOpenFlow} className="gap-2">
                    <Workflow className="h-4 w-4" />
                    Edit Flow
                  </Button>
                )}
              </>
            )}
          </div>

          {/* Right: Timer - Single line with Start button, time, and total */}
          {project && (
            <div className="flex items-center gap-3">
              <TaskWorklog
                taskId={task.id}
                projectId={project.id}
                worklog={taskWorklog}
                onAddWorklog={(entry) => addWorklogEntry(entry)}
                onDeleteWorklog={deleteWorklogEntry}
                compact={true}
              />
            </div>
          )}
        </div>
      </DialogContent>

      {/* Unsaved Changes Confirmation Dialog */}
      <Dialog 
        open={showUnsavedChangesDialog} 
        onOpenChange={(open) => {
          if (!open) {
            handleCancelUnsavedDialog();
          }
        }}
      >
        <DialogContent 
          className="max-w-md"
          onEscapeKeyDown={(e) => {
            e.preventDefault();
            handleCancelUnsavedDialog();
          }}
          onInteractOutside={(e) => {
            e.preventDefault();
            handleCancelUnsavedDialog();
          }}
        >
          <DialogHeader>
            <DialogTitle className="text-xl">You made changes</DialogTitle>
            <DialogDescription className="text-base mt-2">
              You have unsaved changes. Do you want to save them before closing?
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-end gap-3 mt-6">
            <Button
              variant="outline"
              onClick={handleCancelUnsavedDialog}
            >
              Cancel
            </Button>
            <Button
              variant="outline"
              onClick={handleDiscardAndClose}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              Don't Save
            </Button>
            <Button
              onClick={handleSaveAndClose}
            >
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
};

