import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";

interface ActiveTimer {
  taskId: string;
  projectId: string;
  startedAt: number; // timestamp in milliseconds
}

interface TaskTimerContextType {
  activeTimer: ActiveTimer | null;
  elapsedSeconds: number;
  startTimer: (taskId: string, projectId: string) => void;
  stopTimer: () => void;
  isRunning: boolean;
}

const TaskTimerContext = createContext<TaskTimerContextType | undefined>(undefined);

const STORAGE_KEY = "buinsoft-active-timer";

// Load timer from localStorage
const loadTimer = (): ActiveTimer | null => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Check if timer is still valid (not too old - max 24 hours)
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours
      if (Date.now() - parsed.startedAt < maxAge) {
        return parsed;
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  } catch (error) {
    console.error("Error loading timer:", error);
  }
  return null;
};

// Save timer to localStorage
const saveTimer = (timer: ActiveTimer | null) => {
  try {
    if (timer) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(timer));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch (error) {
    console.error("Error saving timer:", error);
  }
};

export const TaskTimerProvider = ({ children }: { children: ReactNode }) => {
  const [activeTimer, setActiveTimer] = useState<ActiveTimer | null>(loadTimer);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Calculate elapsed time from active timer
  useEffect(() => {
    if (activeTimer) {
      const updateElapsed = () => {
        const elapsed = Math.floor((Date.now() - activeTimer.startedAt) / 1000);
        setElapsedSeconds(elapsed);
      };

      // Update immediately
      updateElapsed();

      // Then update every second
      const interval = setInterval(updateElapsed, 1000);

      return () => clearInterval(interval);
    } else {
      setElapsedSeconds(0);
    }
  }, [activeTimer]);

  const startTimer = useCallback(async (taskId: string, projectId: string) => {
    const newTimer: ActiveTimer = {
      taskId,
      projectId,
      startedAt: Date.now(),
    };
    setActiveTimer(newTimer);
    saveTimer(newTimer);

    // Send to backend for SSE broadcasting
    try {
      const API_URL = import.meta.env.VITE_API_URL || "/api";
      const DEFAULT_USER = "Emre Kılınç"; // TODO: Get from auth context
      await fetch(`${API_URL}/timers/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId,
          projectId,
          userId: DEFAULT_USER,
        }),
      });
    } catch (error) {
      console.error("Failed to start timer on backend:", error);
      // Continue with local timer even if backend fails
    }
  }, []);

  const stopTimer = useCallback(async () => {
    const currentTimer = activeTimer;
    setActiveTimer(null);
    saveTimer(null);
    setElapsedSeconds(0);

    // Send to backend for SSE broadcasting
    if (currentTimer) {
      try {
        const API_URL = import.meta.env.VITE_API_URL || "/api";
        const DEFAULT_USER = "Emre Kılınç"; // TODO: Get from auth context
        await fetch(`${API_URL}/timers/stop`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: DEFAULT_USER,
          }),
        });
      } catch (error) {
        console.error("Failed to stop timer on backend:", error);
        // Continue even if backend fails
      }
    }
  }, [activeTimer]);

  return (
    <TaskTimerContext.Provider
      value={{
        activeTimer,
        elapsedSeconds,
        startTimer,
        stopTimer,
        isRunning: activeTimer !== null,
      }}
    >
      {children}
    </TaskTimerContext.Provider>
  );
};

export const useTaskTimer = () => {
  const context = useContext(TaskTimerContext);
  if (!context) {
    throw new Error("useTaskTimer must be used within TaskTimerProvider");
  }
  return context;
};

