import { useMemo } from "react";
import { useComments } from "./useComments";
import { useApp } from "@/contexts/AppContext";

export const useRecentComments = (limit: number = 10) => {
  const { getAllComments } = useComments();
  const { projects } = useApp();

  const recentComments = useMemo(() => {
    const allComments = getAllComments();
    const commentsWithContext = allComments.slice(0, limit).map((comment) => {
      const project = projects.find((p) => p.id === comment.projectId);
      const task = comment.taskId
        ? project?.tasks.find((t) => t.id === comment.taskId)
        : undefined;

      return {
        ...comment,
        projectTitle: project?.title || "Unknown Project",
        taskTitle: task?.title,
      };
    });

    return commentsWithContext;
  }, [getAllComments, projects, limit]);

  return {
    recentComments,
  };
};

