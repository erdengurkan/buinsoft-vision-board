import { useRecentComments } from "@/hooks/useRecentComments";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, User, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/contexts/AppContext";
import { cn } from "@/lib/utils";

export const RecentComments = () => {
  const navigate = useNavigate();
  const { projects } = useApp();
  const { recentComments } = useRecentComments(10);

  const handleCommentClick = (comment: typeof recentComments[0]) => {
    const project = projects.find((p) => p.id === comment.projectId);
    if (project) {
      navigate(`/project/${project.id}`);
    }
  };

  if (recentComments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Recent Comments
          </CardTitle>
          <CardDescription>Latest activity across projects and tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No comments yet</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Recent Comments
        </CardTitle>
        <CardDescription>Latest activity across projects and tasks</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {recentComments.map((comment) => (
            <div
              key={comment.id}
              className={cn(
                "p-3 rounded-lg border border-border bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer group",
                "hover:border-primary/50"
              )}
              onClick={() => handleCommentClick(comment)}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <User className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                  <span className="text-xs font-medium truncate">{comment.user}</span>
                  <span className="text-xs text-muted-foreground flex-shrink-0">
                    {format(comment.timestamp, "MMM d, HH:mm")}
                  </span>
                </div>
                <ArrowRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
              </div>
              <p className="text-sm text-foreground line-clamp-2 mb-2">
                {comment.text.length > 50 ? `${comment.text.substring(0, 50)}...` : comment.text}
              </p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="font-medium">{comment.projectTitle}</span>
                {comment.taskTitle && (
                  <>
                    <span>•</span>
                    <span>{comment.taskTitle}</span>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

