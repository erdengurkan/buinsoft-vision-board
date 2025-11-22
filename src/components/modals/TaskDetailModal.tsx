import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
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
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { RichTextEditor } from "@/components/editor/RichTextEditor";
import { toast } from "sonner";
import { teamMembers } from "@/data/mockData";
import { useWorkflow } from "@/contexts/WorkflowContext";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useIsMobile } from "@/hooks/use-mobile";

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
  const isMobile = useIsMobile();

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
    } else {
      toast.error("Project not found");
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

  // Modal content component (reusable for both Dialog and Drawer)
  const modalContent = (
    <>
      {/* Header */}
      {isMobile ? (
        <DrawerHeader className="pb-2">
          <DrawerTitle className="text-sm font-semibold">{task.title}</DrawerTitle>
          <DrawerDescription className="text-[10px] text-muted-foreground">
            {projectTitle ? `Project: ${projectTitle}` : "Task details"}
          </DrawerDescription>
        </DrawerHeader>
      ) : (
        <DialogHeader className="pb-1 sm:pb-2 md:pb-4">
          <DialogDescription className="text-[10px] sm:text-xs md:text-sm text-muted-foreground">
            {projectTitle ? `Project: ${projectTitle}` : "Task details"}
          </DialogDescription>
        </DialogHeader>
      )}

      <div className={cn(
        "overflow-y-auto",
        isMobile ? "px-3 pb-3 max-h-[calc(75vh-80px)]" : "p-2 sm:p-3 md:p-6"
      )}>

        <div className={cn(
          isMobile ? "space-y-2" : "grid grid-cols-1 md:grid-cols-3 gap-2 sm:gap-3 md:gap-6"
        )}>
          {/* Left Column: Task Info, Title, Description */}
          <div className={cn(
            isMobile ? "space-y-2" : "md:col-span-2 space-y-2 sm:space-y-3 md:space-y-6 order-1"
          )}>
            {/* Task Info - Kompakt mobilde */}
            <div className={cn(
              "border border-border rounded-lg",
              isMobile ? "grid grid-cols-2 gap-1.5 p-2" : "grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 p-2 sm:p-3 md:p-4"
            )}>
              <div className={cn("space-y-1", isMobile ? "space-y-0.5" : "sm:space-y-2")}>
                <Label className={cn("text-muted-foreground", isMobile ? "text-[9px]" : "text-[10px] sm:text-xs md:text-sm")}>Status</Label>
                {isEditing ? (
                  <Select 
                    value={formData.status} 
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger className={cn(isMobile && "h-7 text-[10px]")}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent side={isMobile ? "top" : "bottom"} align="start" className={cn(isMobile && "max-h-[40vh]")}>
                      {taskStatuses.map((status) => (
                        <SelectItem key={status.id} value={status.name}>
                          {status.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge variant="outline" className={cn(isMobile && "text-[9px] px-1.5 py-0.5")}>{task.status}</Badge>
                )}
              </div>
              <div className={cn("space-y-1", isMobile ? "space-y-0.5" : "sm:space-y-2")}>
                <Label className={cn("text-muted-foreground", isMobile ? "text-[9px]" : "text-[10px] sm:text-xs md:text-sm")}>Priority</Label>
                {isEditing ? (
                  <Select 
                    value={formData.priority} 
                    onValueChange={(value) => setFormData({ ...formData, priority: value as Priority })}
                  >
                    <SelectTrigger className={cn(isMobile && "h-7 text-[10px]")}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent side={isMobile ? "top" : "bottom"} align="start" className={cn(isMobile && "max-h-[40vh]")}>
                      <SelectItem value="Low">Low</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="High">High</SelectItem>
                      <SelectItem value="Critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge className={cn("px-2 py-0.5", priorityColors[task.priority], isMobile && "text-[9px] px-1.5")}>{task.priority}</Badge>
                )}
              </div>
              <div className={cn("space-y-1", isMobile ? "space-y-0.5" : "sm:space-y-2")}>
                <Label className={cn("text-muted-foreground", isMobile ? "text-[9px]" : "text-[10px] sm:text-xs md:text-sm")}>Assignee</Label>
                {isEditing ? (
                  <Select 
                    value={formData.assignee} 
                    onValueChange={(value) => setFormData({ ...formData, assignee: value })}
                  >
                    <SelectTrigger className={cn(isMobile && "h-7 text-[10px]")}>
                      <SelectValue placeholder="Select assignee" />
                    </SelectTrigger>
                    <SelectContent side={isMobile ? "top" : "bottom"} align="start" className={cn(isMobile && "max-h-[40vh]")}>
                      {teamMembers.map((member) => (
                        <SelectItem key={member.id} value={member.name}>
                          {member.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <User className={cn("text-muted-foreground", isMobile ? "h-3 w-3" : "h-4 w-4")} />
                    <span className={cn(isMobile && "text-[10px]")}>{task.assignee}</span>
                  </div>
                )}
              </div>
              <div className={cn("space-y-1", isMobile ? "space-y-0.5" : "sm:space-y-2")}>
                <Label className={cn("text-muted-foreground", isMobile ? "text-[9px]" : "text-[10px] sm:text-xs md:text-sm")}>Deadline</Label>
                {isEditing ? (
                  <Popover open={deadlinePopoverOpen} onOpenChange={setDeadlinePopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-full justify-start text-left font-normal", isMobile && "h-7 text-[10px] px-2")}>
                        <CalendarIcon className={cn("mr-1.5", isMobile ? "h-3 w-3" : "mr-2 h-4 w-4")} />
                        {formData.deadline ? format(formData.deadline, isMobile ? "MMM d" : "PPP") : <span>Optional</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.deadline}
                        onSelect={(date) => {
                          setFormData({ ...formData, deadline: date });
                          setDeadlinePopoverOpen(false);
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                ) : (
                  task.deadline ? (
                    <div className="flex items-center gap-1.5">
                      <CalendarIcon className={cn("text-muted-foreground", isMobile ? "h-3 w-3" : "h-4 w-4")} />
                      <span className={cn(isMobile && "text-[10px]")}>{format(task.deadline, isMobile ? "MMM d" : "MMM d, yyyy")}</span>
                    </div>
                  ) : (
                    <span className={cn("text-muted-foreground", isMobile ? "text-[9px]" : "text-sm")}>No deadline</span>
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

            {/* Title */}
            <div className={cn("space-y-1", isMobile ? "space-y-0.5" : "sm:space-y-2")}>
              <Label className={cn("font-medium", isMobile ? "text-[9px]" : "text-[10px] sm:text-xs md:text-sm")}>Title</Label>
              {isEditing ? (
                <Input
                  value={formData.title || ""}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className={cn(
                    "font-semibold",
                    isMobile ? "text-xs h-7" : "text-sm sm:text-base md:text-lg h-8 sm:h-10"
                  )}
                  placeholder="Task title"
                  onContextMenu={(e) => isMobile && e.preventDefault()}
                />
              ) : (
                <div className={cn(
                  "font-semibold flex items-center gap-2",
                  isMobile ? "text-xs" : "text-sm sm:text-base md:text-lg"
                )}>
                  {task.title}
                  {task.flowDiagram && !isMobile && (
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

            {/* Description - Basit textarea mobilde */}
            <div className={cn("space-y-1", isMobile ? "space-y-0.5" : "sm:space-y-2")}>
              <Label className={cn("font-medium", isMobile ? "text-[9px]" : "text-[10px] sm:text-xs md:text-sm")}>Description</Label>
              {isEditing ? (
                isMobile ? (
                  <Textarea
                    value={formData.description || ""}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Add a description..."
                    rows={3}
                    className="text-[10px] resize-none min-h-[60px]"
                    onContextMenu={(e) => e.preventDefault()}
                  />
                ) : (
                <RichTextEditor
                  content={formData.description || ""}
                  onChange={(html) => setFormData({ ...formData, description: html })}
                  placeholder="Add a description..."
                    className="min-h-[100px] sm:min-h-[150px] md:min-h-[200px]"
                />
                )
              ) : (
                <div
                  className={cn(
                    "text-muted-foreground bg-muted/30 rounded-lg prose prose-sm max-w-none prose-p:my-0.5 prose-p:first:mt-0 prose-p:last:mb-0 prose-headings:my-1 prose-headings:first:mt-0 prose-ul:my-1 prose-ol:my-1 prose-li:my-0",
                    isMobile ? "text-[9px] p-1.5 min-h-[40px]" : "text-[10px] sm:text-xs md:text-sm p-1.5 sm:p-2 md:p-3 min-h-[40px] sm:min-h-[50px] md:min-h-[60px]"
                  )}
                  dangerouslySetInnerHTML={{
                    __html: task.description || "<p class='text-muted-foreground italic'>No description</p>",
                  }}
                  onContextMenu={(e) => isMobile && e.preventDefault()}
                />
              )}
            </div>

          </div>

          {/* Right Column: Comments - Hidden on mobile */}
          {!isMobile && (
            <div className="md:col-span-1 order-2 md:order-2">
            {project && (
                <div className="space-y-1 sm:space-y-2">
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
                </div>
            )}
          </div>
          )}
        </div>

        {/* Bottom Bar: Timer on left, Cancel/Save buttons on right */}
        <div className={cn(
          "flex items-stretch justify-between border-t border-border",
          isMobile ? "flex-col gap-1.5 pt-2 mt-2" : "flex-col sm:flex-row items-center gap-1.5 sm:gap-2 md:gap-3 pt-2 sm:pt-3 md:pt-4 mt-2 sm:mt-3 md:mt-4"
        )}>
          {/* Left: Timer - Hidden on mobile */}
          {project && !isMobile && (
            <div className="flex items-center gap-3 flex-shrink-0">
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

          {/* Right: Cancel and Save Changes buttons */}
          <div className={cn(
            "flex items-stretch",
            isMobile ? "flex-row gap-1.5" : "flex-col sm:flex-row items-center gap-1.5 sm:gap-2 w-full sm:w-auto"
          )}>
            {isEditing ? (
              <>
                <Button 
                  variant="outline" 
                  onClick={handleCloseRequest} 
                  className={cn(
                    isMobile ? "flex-1 h-8 text-[10px]" : "w-full sm:w-auto h-8 sm:h-9 md:min-h-[44px] text-xs sm:text-sm"
                  )}
                  onContextMenu={(e) => isMobile && e.preventDefault()}
                >
                  Cancel
                </Button>
                {!isMobile && (
                  <Button variant="outline" onClick={handleOpenFlow} className="gap-1 sm:gap-2 w-full sm:w-auto h-8 sm:h-9 md:min-h-[44px] text-xs sm:text-sm">
                    <Workflow className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Edit Flow</span>
                    <span className="sm:hidden">Flow</span>
                </Button>
                )}
                <Button 
                  onClick={handleSave} 
                  className={cn(
                    isMobile ? "flex-1 h-8 text-[10px]" : "w-full sm:w-auto h-8 sm:h-9 md:min-h-[44px] text-xs sm:text-sm"
                  )}
                  onContextMenu={(e) => isMobile && e.preventDefault()}
                >
                  Save
                </Button>
              </>
            ) : (
              <>
                <Button 
                  variant="outline" 
                  onClick={() => setIsEditing(true)} 
                  className={cn(
                    isMobile ? "flex-1 h-8 text-[10px]" : "gap-1 sm:gap-2 w-full sm:w-auto h-8 sm:h-9 md:min-h-[44px] text-xs sm:text-sm"
                  )}
                  onContextMenu={(e) => isMobile && e.preventDefault()}
                >
                  <Edit2 className={cn(isMobile ? "h-3 w-3" : "h-3 w-3 sm:h-4 sm:w-4")} />
                  <span className={isMobile ? "" : "hidden sm:inline"}>Edit Task</span>
                  {isMobile && <span>Edit</span>}
                </Button>
                {!isMobile && (
                  <Button variant="outline" onClick={handleOpenFlow} className="gap-1 sm:gap-2 w-full sm:w-auto h-8 sm:h-9 md:min-h-[44px] text-xs sm:text-sm">
                    <Workflow className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Edit Flow</span>
                    <span className="sm:hidden">Flow</span>
                </Button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );

  return (
    <>
      {isMobile ? (
        <Drawer open={open} onOpenChange={handleDialogOpenChange}>
          <DrawerContent 
            className="max-h-[75vh]"
            onInteractOutside={(e) => {
              if (isEditing && hasChanges()) {
                e.preventDefault();
                handleCloseRequest();
              }
            }}
            onContextMenu={(e) => e.preventDefault()}
          >
            {modalContent}
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={open} onOpenChange={handleDialogOpenChange}>
          <DialogContent 
            className="max-w-[98vw] sm:max-w-2xl md:max-w-4xl lg:max-w-6xl max-h-[98vh] sm:max-h-[90vh] overflow-y-auto p-2 sm:p-3 md:p-6" 
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
            {modalContent}
      </DialogContent>
        </Dialog>
      )}

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
          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3 mt-6">
            <Button
              variant="outline"
              onClick={handleCancelUnsavedDialog}
              className="w-full sm:w-auto min-h-[44px]"
            >
              Cancel
            </Button>
            <Button
              variant="outline"
              onClick={handleDiscardAndClose}
              className="text-destructive hover:text-destructive hover:bg-destructive/10 w-full sm:w-auto min-h-[44px]"
            >
              Don't Save
            </Button>
            <Button
              onClick={handleSaveAndClose}
              className="w-full sm:w-auto min-h-[44px]"
            >
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

