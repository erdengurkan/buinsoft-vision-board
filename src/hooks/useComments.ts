import { useState, useEffect, useCallback } from "react";
import { Comment } from "@/types";

const STORAGE_KEY = "buinsoft-vision-board-comments";
const DEFAULT_USER = "Buinsoft User";

// Load comments from localStorage
const loadComments = (): Comment[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.map((comment: any) => ({
        ...comment,
        timestamp: new Date(comment.timestamp),
      }));
    }
  } catch (error) {
    console.error("Error loading comments:", error);
  }
  return [];
};

// Save comments to localStorage
const saveComments = (comments: Comment[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(comments));
  } catch (error) {
    console.error("Error saving comments:", error);
  }
};

export const useComments = () => {
  const [comments, setComments] = useState<Comment[]>(loadComments);

  // Save comments whenever they change
  useEffect(() => {
    saveComments(comments);
  }, [comments]);

  const addComment = useCallback(
    (projectId: string, taskId: string | undefined, text: string) => {
      const newComment: Comment = {
        id: `comment-${Date.now()}-${Math.random()}`,
        projectId,
        taskId,
        text,
        user: DEFAULT_USER,
        timestamp: new Date(),
      };

      setComments((prev) => [newComment, ...prev]);
      return newComment;
    },
    []
  );

  const deleteComment = useCallback((commentId: string) => {
    setComments((prev) => prev.filter((comment) => comment.id !== commentId));
  }, []);

  const getProjectComments = useCallback(
    (projectId: string): Comment[] => {
      // Return ALL comments for the project (both project-level and task-linked)
      return comments.filter((c) => c.projectId === projectId);
    },
    [comments]
  );

  const getTaskComments = useCallback(
    (taskId: string): Comment[] => {
      return comments.filter((c) => c.taskId === taskId);
    },
    [comments]
  );

  const getAllComments = useCallback((): Comment[] => {
    return [...comments].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [comments]);

  return {
    comments,
    addComment,
    deleteComment,
    getProjectComments,
    getTaskComments,
    getAllComments,
  };
};


