import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Task } from "@/types";
import { TaskWorklog } from "@/components/tasks/TaskWorklog";
import { Comments } from "@/components/comments/Comments";
import { useWorklog } from "@/hooks/useWorklog";
import { useComments } from "@/hooks/useComments";
import { useActivityLog } from "@/hooks/useActivityLog";
import { useTaskTimer } from "@/contexts/TaskTimerContext";
import { useApp } from "@/contexts/AppContext";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Priority } from "@/types";
import { format } from "date-fns";
import { User, Calendar, Flag } from "lucide-react";

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
  const { getTaskWorklog, addWorklogEntry, deleteWorklogEntry } = useWorklog();
  const { addComment, deleteComment, getTaskComments } = useComments();
  const { logActivity } = useActivityLog();
  const { activeTimer, stopTimer } = useTaskTimer();

  if (!task) return null;

  const taskWorklog = getTaskWorklog(task.id);
  const taskComments = getTaskComments(task.id);
  
  // Find project for this task
  const { projects } = useApp();
  const project = projects.find((p) => p.tasks.some((t) => t.id === task.id));

  // If modal closes and timer is running for this task, we need to handle it
  // The timer will continue running globally, which is the desired behavior

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{task.title}</DialogTitle>
          {projectTitle && (
            <p className="text-sm text-muted-foreground">Project: {projectTitle}</p>
          )}
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Task Info */}
          <div className="grid grid-cols-2 gap-4 p-4 border border-border rounded-lg">
            <div>
              <div className="text-sm text-muted-foreground mb-1">Status</div>
              <Badge variant="outline">{task.status}</Badge>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">Priority</div>
              <Badge className={cn(priorityColors[task.priority])}>{task.priority}</Badge>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">Assignee</div>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>{task.assignee}</span>
              </div>
            </div>
            {task.deadline && (
              <div>
                <div className="text-sm text-muted-foreground mb-1">Deadline</div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>{format(task.deadline, "MMM d, yyyy")}</span>
                </div>
              </div>
            )}
            {task.followUp && (
              <div>
                <div className="text-sm text-muted-foreground mb-1">Follow-up</div>
                <div className="flex items-center gap-2">
                  <Flag className="h-4 w-4 text-orange-500" />
                  <span className="text-orange-600 dark:text-orange-400">Required</span>
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          {task.description && (
            <div>
              <h3 className="text-sm font-medium mb-2">Description</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap p-3 bg-muted/30 rounded-lg">
                {task.description}
              </p>
            </div>
          )}

          {/* Worklog */}
          {project && (
            <TaskWorklog
              taskId={task.id}
              projectId={project.id}
              worklog={taskWorklog}
              onAddWorklog={(entry) => addWorklogEntry(entry)}
              onDeleteWorklog={deleteWorklogEntry}
            />
          )}

          {/* Comments */}
          {project && (
            <Comments
              projectId={project.id}
              taskId={task.id}
              comments={taskComments}
              onAddComment={(text) => {
                addComment(project.id, task.id, text);
                // Log activity
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
      </DialogContent>
    </Dialog>
  );
};

