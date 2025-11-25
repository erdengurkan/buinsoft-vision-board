import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Comment } from "@/types";
import { toast } from "sonner";
import api from "@/lib/api";

const DEFAULT_USER = "Emre Kılınç";

export const useComments = (projectId?: string) => {
  const queryClient = useQueryClient();

  // Fetch project comments if projectId provided
  const { data: projectComments = [] } = useQuery({
    queryKey: ["comments", "project", projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const data = await api.get<Comment[]>(`/comments?projectId=${projectId}`);
      return data.map((comment: any) => ({
        ...comment,
        timestamp: new Date(comment.timestamp),
      }));
    },
    enabled: !!projectId,
  });

  const addCommentMutation = useMutation({
    mutationFn: async ({ projectId, taskId, text }: { projectId: string; taskId?: string; text: string }) => {
      return api.post<Comment>("/comments", {
        projectId,
        taskId,
        text,
        user: DEFAULT_USER,
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["comments"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
    onError: () => {
      toast.error("Failed to add comment");
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      return api.delete(`/comments/${commentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
    onError: () => {
      toast.error("Failed to delete comment");
    },
  });

  const addComment = async (projectId: string, taskId: string | undefined, text: string) => {
    try {
      const newComment = await addCommentMutation.mutateAsync({ projectId, taskId, text });
      return {
        ...newComment,
        timestamp: new Date(newComment.timestamp),
      };
    } catch (error) {
      return null;
    }
  };

  const deleteComment = async (commentId: string) => {
    try {
      await deleteCommentMutation.mutateAsync(commentId);
    } catch (error) {
      // Error already handled in mutation
    }
  };

  const getProjectComments = (projectId: string): Comment[] => {
    // Get from query cache
    const comments = queryClient.getQueryData<Comment[]>(["comments", "project", projectId]);
    return comments || [];
  };

  const getTaskComments = (taskId: string): Comment[] => {
    // Get task comments from project comments (they're included in project comments)
    if (!projectId) return [];
    const comments = queryClient.getQueryData<Comment[]>(["comments", "project", projectId]);
    return (comments || []).filter((c) => c.taskId === taskId);
  };

  const getAllComments = (): Comment[] => {
    // Get all project comments from cache
    const projects = queryClient.getQueryData<any[]>(["projects"]);
    if (!projects) return [];
    
    const allComments: Comment[] = [];
    projects.forEach((project) => {
      const comments = getProjectComments(project.id);
      allComments.push(...comments);
    });
    
    return allComments.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  };

  return {
    comments: projectComments,
    addComment,
    deleteComment,
    getProjectComments,
    getTaskComments,
    getAllComments,
  };
};
