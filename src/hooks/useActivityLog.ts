import { useState, useEffect, useCallback } from "react";
import { ActivityLog, ActivityType } from "@/types";

const STORAGE_KEY = "buinsoft-vision-board-activity-logs";
const DEFAULT_USER = "Buinsoft User";

// Load activity logs from localStorage
const loadActivityLogs = (): ActivityLog[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.map((log: any) => ({
        ...log,
        timestamp: new Date(log.timestamp),
      }));
    }
  } catch (error) {
    console.error("Error loading activity logs:", error);
  }
  return [];
};

// Save activity logs to localStorage
const saveActivityLogs = (logs: ActivityLog[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
  } catch (error) {
    console.error("Error saving activity logs:", error);
  }
};

export const useActivityLog = () => {
  const [logs, setLogs] = useState<ActivityLog[]>(loadActivityLogs);

  // Save logs whenever they change
  useEffect(() => {
    saveActivityLogs(logs);
  }, [logs]);

  const logActivity = useCallback(
    (
      projectId: string,
      actionType: ActivityType,
      description: string,
      metadata?: ActivityLog["metadata"]
    ) => {
      const newLog: ActivityLog = {
        id: `log-${Date.now()}-${Math.random()}`,
        projectId,
        timestamp: new Date(),
        user: DEFAULT_USER,
        actionType,
        description,
        metadata,
      };

      setLogs((prev) => [newLog, ...prev]);
      return newLog;
    },
    []
  );

  const getProjectLogs = useCallback(
    (projectId: string): ActivityLog[] => {
      return logs
        .filter((log) => log.projectId === projectId)
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    },
    [logs]
  );

  const getAllLogs = useCallback((): ActivityLog[] => {
    return [...logs].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [logs]);

  return {
    logs,
    logActivity,
    getProjectLogs,
    getAllLogs,
  };
};

