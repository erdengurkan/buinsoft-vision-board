import { useState } from "react";
import { Comment } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { User, Trash2, MessageSquare, Reply, X, Send } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useApp } from "@/contexts/AppContext";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
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

  const handleReply = (commentId: string) => {
    setReplyingTo(commentId);
    setReplyText("");
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
    setReplyText("");
  };

  const handleSubmitReply = async (e: React.FormEvent, parentCommentId: string) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    setIsSubmitting(true);
    try {
      // Reply'i "@username " prefix'i ile ekle
      const parentComment = comments.find((c) => c.id === parentCommentId);
      const replyPrefix = parentComment ? `@${parentComment.user} ` : "";
      onAddComment(replyPrefix + replyText.trim());
      setReplyingTo(null);
      setReplyText("");
      toast.success("Reply added");
    } catch (error) {
      toast.error("Failed to add reply");
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
    <Card className="h-full flex flex-col">
      <CardHeader className="flex-shrink-0 pb-1 sm:pb-2 md:pb-3">
        <CardTitle className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm md:text-lg">
          <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4" />
          Comments
        </CardTitle>
        <CardDescription className="text-[10px] sm:text-xs">
          {filteredComments.length} comment{filteredComments.length !== 1 ? "s" : ""}
          {taskId ? " on this task" : " (including task comments)"}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col space-y-1.5 sm:space-y-2 md:space-y-3 min-h-0 p-2 sm:p-4 md:p-6">
        {/* Comments List - Üstte, scroll edilebilir */}
        {filteredComments.length > 0 ? (
          <div className="flex-1 overflow-y-auto space-y-1.5 sm:space-y-2 md:space-y-2.5 pr-1 sm:pr-2">
            {filteredComments
              .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
              .map((comment) => (
                <div key={comment.id} className="space-y-1 sm:space-y-1.5">
                  <div className="p-1.5 sm:p-2 md:p-2.5 rounded-md border border-border/50 bg-muted/20 hover:bg-muted/40 transition-colors">
                    <div className="flex items-start gap-1 sm:gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1 sm:gap-1.5 mb-0.5 sm:mb-1">
                          <User className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-muted-foreground flex-shrink-0" />
                          <span className="text-[10px] sm:text-xs font-semibold">{comment.user}</span>
                          <span className="text-[9px] sm:text-[10px] text-muted-foreground">
                            {format(comment.timestamp, "MMM d, HH:mm")}
                          </span>
                        </div>
                        {comment.taskId && (
                          <div className="mb-1 sm:mb-1.5 ml-3 sm:ml-5">
                            <Badge
                              variant="outline"
                              className="cursor-pointer hover:bg-primary/10 hover:border-primary transition-colors text-[9px] sm:text-[10px] px-1 sm:px-1.5 py-0 h-3 sm:h-4"
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
                        <p className="text-[10px] sm:text-xs text-foreground whitespace-pre-wrap ml-3 sm:ml-5 break-words leading-relaxed">
                          {comment.text}
                        </p>
                      </div>
                      <div className="flex items-start gap-0.5 flex-shrink-0 pt-0.5">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground hover:text-foreground"
                                onClick={() => handleReply(comment.id)}
                              >
                                <Reply className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-xs">Reply</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        {comment.user === DEFAULT_USER && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground hover:text-destructive"
                                  onClick={() => onDeleteComment(comment.id)}
                                >
                                  <Trash2 className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="text-xs">Delete</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Reply Input - Kompakt inline */}
                  {replyingTo === comment.id && (
                    <div className="ml-3 sm:ml-5 pl-2 sm:pl-3 border-l-2 border-primary/30">
                      <form
                        onSubmit={(e) => handleSubmitReply(e, comment.id)}
                        className="flex items-end gap-1 sm:gap-1.5"
                      >
                        <Textarea
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder={`Reply to ${comment.user}...`}
                          rows={1}
                          className="resize-none text-[10px] sm:text-xs min-h-[24px] sm:min-h-[28px] py-1 sm:py-1.5 px-1.5 sm:px-2 flex-1"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Escape") {
                              handleCancelReply();
                            }
                          }}
                        />
                        <div className="flex items-center gap-0.5 sm:gap-1">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 sm:h-7 sm:w-7 text-muted-foreground hover:text-foreground"
                                  onClick={handleCancelReply}
                                >
                                  <X className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="text-xs">Cancel</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  type="submit"
                                  size="icon"
                                  className="h-6 w-6 sm:h-7 sm:w-7"
                                  disabled={isSubmitting || !replyText.trim()}
                                >
                                  <Send className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="text-xs">Send reply</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </form>
                    </div>
                  )}
                </div>
              ))}
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-center py-8 text-muted-foreground border-t">
            <div>
              <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No comments yet</p>
            </div>
          </div>
        )}

        {/* Comment Input - Altta, sabit */}
        <div className="flex-shrink-0 border-t pt-1.5 sm:pt-2 md:pt-3">
          <form onSubmit={handleSubmit} className="space-y-1 sm:space-y-1.5 md:space-y-2">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              rows={1}
              className="resize-none text-[10px] sm:text-xs md:text-sm min-h-[32px] sm:min-h-[40px] py-1 sm:py-1.5 px-2"
            />
            <div className="flex justify-end">
              <Button type="submit" size="sm" disabled={isSubmitting || !newComment.trim()} className="h-7 sm:h-8 md:h-9 text-[10px] sm:text-xs md:text-sm">
                Post
              </Button>
            </div>
          </form>
        </div>
      </CardContent>
    </Card>
  );
};

