import { useState, useEffect, useCallback } from "react";
import { WorklogEntry } from "@/types";

const STORAGE_KEY = "buinsoft-vision-board-worklog";
const DEFAULT_USER = "Buinsoft User";

// Load worklog from localStorage
const loadWorklog = (): WorklogEntry[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.map((entry: any) => ({
        ...entry,
        startedAt: new Date(entry.startedAt),
        stoppedAt: new Date(entry.stoppedAt),
      }));
    }
  } catch (error) {
    console.error("Error loading worklog:", error);
  }
  return [];
};

// Save worklog to localStorage
const saveWorklog = (worklog: WorklogEntry[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(worklog));
  } catch (error) {
    console.error("Error saving worklog:", error);
  }
};

export const useWorklog = () => {
  const [worklog, setWorklog] = useState<WorklogEntry[]>(loadWorklog);

  // Save worklog whenever it changes
  useEffect(() => {
    saveWorklog(worklog);
  }, [worklog]);

  const addWorklogEntry = useCallback(
    (entry: Omit<WorklogEntry, "id">) => {
      const newEntry: WorklogEntry = {
        ...entry,
        id: `worklog-${Date.now()}-${Math.random()}`,
      };

      setWorklog((prev) => [newEntry, ...prev]);
      return newEntry;
    },
    []
  );

  const deleteWorklogEntry = useCallback((entryId: string) => {
    setWorklog((prev) => prev.filter((entry) => entry.id !== entryId));
  }, []);

  const getTaskWorklog = useCallback(
    (taskId: string): WorklogEntry[] => {
      return worklog.filter((entry) => entry.taskId === taskId);
    },
    [worklog]
  );

  const getProjectTotalTime = useCallback(
    (projectTaskIds: string[]): number => {
      // Return total time in seconds
      return Math.floor(
        worklog
          .filter((entry) => projectTaskIds.includes(entry.taskId))
          .reduce((sum, entry) => sum + entry.durationMs, 0) / 1000
      );
    },
    [worklog]
  );

  return {
    worklog,
    addWorklogEntry,
    deleteWorklogEntry,
    getTaskWorklog,
    getProjectTotalTime,
  };
};

