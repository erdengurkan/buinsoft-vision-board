import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ActivityLog, ActivityType } from "@/types";
import { toast } from "sonner";

const API_URL = import.meta.env.VITE_API_URL || "/api";
const DEFAULT_USER = "Emre Kılınç";

export const useActivityLog = (projectId?: string) => {
  const queryClient = useQueryClient();

  // Fetch project activity logs if projectId provided
  const { data: projectLogs = [] } = useQuery({
    queryKey: ["activity-logs", projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const res = await fetch(`${API_URL}/activity-logs?projectId=${projectId}`);
      if (!res.ok) throw new Error("Failed to fetch activity logs");
      const data = await res.json();
      return data.map((log: any) => ({
        ...log,
        timestamp: new Date(log.timestamp),
      }));
    },
    enabled: !!projectId,
  });

  const logActivityMutation = useMutation({
    mutationFn: async ({
      projectId,
      actionType,
      description,
      metadata,
    }: {
      projectId: string;
      actionType: ActivityType;
      description: string;
      metadata?: ActivityLog["metadata"];
    }) => {
      const res = await fetch(`${API_URL}/activity-logs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          user: DEFAULT_USER,
          actionType,
          description,
          metadata,
        }),
      });
      if (!res.ok) throw new Error("Failed to create activity log");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activity-logs"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
    onError: () => {
      toast.error("Failed to log activity");
    },
  });

  const logActivity = async (
    projectId: string,
    actionType: ActivityType,
    description: string,
    metadata?: ActivityLog["metadata"]
  ) => {
    try {
      const newLog = await logActivityMutation.mutateAsync({
        projectId,
        actionType,
        description,
        metadata,
      });
      return {
        ...newLog,
        timestamp: new Date(newLog.timestamp),
      };
    } catch (error) {
      return null;
    }
  };

  const getProjectLogs = (projectId: string): ActivityLog[] => {
    // Get from query cache
    const logs = queryClient.getQueryData<ActivityLog[]>(["activity-logs", projectId]);
    return logs || [];
  };

  const getAllLogs = (): ActivityLog[] => {
    // Get all logs from cache
    const projects = queryClient.getQueryData<any[]>(["projects"]);
    if (!projects) return [];
    
    const allLogs: ActivityLog[] = [];
    projects.forEach((project) => {
      const logs = getProjectLogs(project.id);
      allLogs.push(...logs);
    });
    
    return allLogs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  };

  return {
    logs: projectLogs,
    logActivity,
    getProjectLogs,
    getAllLogs,
  };
};
