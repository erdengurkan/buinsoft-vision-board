import { useState } from "react";
import { Comment } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { User, Trash2, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useApp } from "@/contexts/AppContext";

interface CommentsProps {
  projectId: string;
  taskId?: string; // if provided, comments are task-specific
  comments: Comment[];
  onAddComment: (text: string) => void;
  onDeleteComment: (commentId: string) => void;
  onTaskClick?: (taskId: string) => void; // callback when task chip is clicked
}

const DEFAULT_USER = "Buinsoft User";

export const Comments = ({
  projectId,
  taskId,
  comments,
  onAddComment,
  onDeleteComment,
  onTaskClick,
}: CommentsProps) => {
  const { projects } = useApp();
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) {
      toast.error("Comment cannot be empty");
      return;
    }

    setIsSubmitting(true);
    try {
      onAddComment(newComment.trim());
      setNewComment("");
      toast.success("Comment added");
    } catch (error) {
      toast.error("Failed to add comment");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter comments: if taskId is provided, show only task comments, otherwise show ALL project comments (including task-linked)
  const filteredComments = comments.filter((c) => {
    if (taskId) {
      // Task view: show only this task's comments
      return c.taskId === taskId && c.projectId === projectId;
    } else {
      // Project view: show ALL comments for the project (both project-level and task-linked)
      return c.projectId === projectId;
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Comments
        </CardTitle>
        <CardDescription>
          {filteredComments.length} comment{filteredComments.length !== 1 ? "s" : ""}
          {taskId ? " on this task" : " (including task comments)"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Comment Input */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            rows={3}
            className="resize-none"
          />
          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting || !newComment.trim()}>
              Post Comment
            </Button>
          </div>
        </form>

        {/* Comments List */}
        {filteredComments.length > 0 ? (
          <div className="space-y-3 border-t pt-4">
            {filteredComments
              .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
              .map((comment) => (
                <div
                  key={comment.id}
                  className="p-3 rounded-lg border border-border bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{comment.user}</span>
                        <span className="text-xs text-muted-foreground">
                          {format(comment.timestamp, "MMM d, yyyy HH:mm")}
                        </span>
                      </div>
                      {comment.taskId && (
                        <div className="mb-2 ml-6">
                          <Badge
                            variant="outline"
                            className="cursor-pointer hover:bg-primary/10 hover:border-primary transition-colors"
                            onClick={() => onTaskClick?.(comment.taskId!)}
                          >
                            Task: {(() => {
                              const project = projects.find((p) => p.id === comment.projectId);
                              const task = project?.tasks.find((t) => t.id === comment.taskId);
                              return task?.title || "Unknown Task";
                            })()}
                          </Badge>
                        </div>
                      )}
                      <p className="text-sm text-foreground whitespace-pre-wrap ml-6">
                        {comment.text}
                      </p>
                    </div>
                    {comment.user === DEFAULT_USER && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 flex-shrink-0"
                        onClick={() => onDeleteComment(comment.id)}
                      >
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground border-t">
            <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No comments yet</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

