import { useTaskTimer } from "@/contexts/TaskTimerContext";
import { useApp } from "@/contexts/AppContext";
import { useWorklog } from "@/hooks/useWorklog";
import { useActiveTimers } from "@/hooks/useActiveTimers";
import { Button } from "@/components/ui/button";
import { Square } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

const API_URL = import.meta.env.VITE_API_URL || "/api";

const formatTimer = (seconds: number): string => {
  if (seconds < 60) {
    return `${seconds}s`;
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
};

export const GlobalTimerBar = () => {
  const { activeTimer: localTimer, elapsedSeconds: localElapsed, stopTimer, isRunning: localIsRunning } = useTaskTimer();
  const { projects } = useApp();
  const { addWorklogEntry } = useWorklog();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  
  // Also check backend for active timers (for other users/windows)
  const { data: backendTimers = [] } = useActiveTimers();
  const DEFAULT_USER = "Emre Kılınç"; // TODO: Get from auth context
  
  // Find active timer - prefer local, fallback to backend
  const backendTimer = backendTimers.find(t => t.userId === DEFAULT_USER);
  const activeTimer = localTimer || (backendTimer ? {
    taskId: backendTimer.taskId,
    projectId: backendTimer.projectId,
    startedAt: new Date(backendTimer.startedAt).getTime(),
  } : null);
  
  const [elapsedSeconds, setElapsedSeconds] = useState(localElapsed);
  
  // Calculate elapsed time - use local if available, otherwise calculate from backend timer
  useEffect(() => {
    if (localTimer) {
      // Use local elapsed time if local timer exists
      setElapsedSeconds(localElapsed);
    } else if (backendTimer) {
      // Calculate from backend timer
      const updateElapsed = () => {
        const startedAt = new Date(backendTimer.startedAt).getTime();
        const elapsed = Math.floor((Date.now() - startedAt) / 1000);
        setElapsedSeconds(elapsed);
      };
      
      updateElapsed();
      const interval = setInterval(updateElapsed, 1000);
      return () => clearInterval(interval);
    } else {
      setElapsedSeconds(0);
    }
  }, [localTimer, localElapsed, backendTimer]);
  
  const isRunning = !!activeTimer;

  if (!isRunning || !activeTimer) {
    return null;
  }

  const project = projects.find((p) => p.id === activeTimer.projectId);
  const task = project?.tasks.find((t) => t.id === activeTimer.taskId);

  const handleStop = async () => {
    const stoppedAt = new Date();
    const startedAt = typeof activeTimer.startedAt === 'number' 
      ? new Date(activeTimer.startedAt) 
      : new Date(activeTimer.startedAt);
    const durationMs = stoppedAt.getTime() - startedAt.getTime();

    console.log("🛑 GlobalTimerBar: Stopping timer", {
      taskId: activeTimer.taskId,
      durationMs,
      startedAt: startedAt.toISOString(),
      stoppedAt: stoppedAt.toISOString(),
      user: DEFAULT_USER,
    });

    if (durationMs > 0) {
      // Save to backend first
      try {
        const worklogData = {
          taskId: activeTimer.taskId,
          durationMs,
          startedAt: startedAt.toISOString(),
          stoppedAt: stoppedAt.toISOString(),
          user: DEFAULT_USER,
        };
        
        console.log("📤 GlobalTimerBar: Sending worklog to backend", `${API_URL}/worklogs`, worklogData);
        
        const response = await fetch(`${API_URL}/worklogs`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(worklogData),
        });

        console.log("📥 GlobalTimerBar: Response status", response.status, response.statusText);

        if (!response.ok) {
          const errorText = await response.text();
          console.error("❌ GlobalTimerBar: Response error", errorText);
          throw new Error(`Failed to save worklog: ${response.status} ${response.statusText}`);
        }

        const savedWorklog = await response.json();
        console.log("✅ GlobalTimerBar: Worklog saved", savedWorklog);

        // Also call addWorklogEntry for local state update
        addWorklogEntry({
          taskId: activeTimer.taskId,
          durationMs,
          startedAt,
          stoppedAt,
          user: DEFAULT_USER,
        });

        // Invalidate queries to refresh data
        queryClient.invalidateQueries({ queryKey: ['projects'] });
        
        toast.success(`Timer stopped and logged`);
      } catch (error) {
        console.error("❌ GlobalTimerBar: Failed to save worklog:", error);
        toast.error("Failed to save worklog to server");
      }
    } else {
      console.warn("⚠️ GlobalTimerBar: Duration is 0 or negative, skipping worklog save");
    }

    // Stop timer (will sync with backend via TaskTimerContext)
    await stopTimer();
  };

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-50 bg-red-600 dark:bg-red-700 text-white px-4 py-2 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              <span className="font-medium">Tracking:</span>
              <span className="font-mono font-bold text-lg">{formatTimer(elapsedSeconds)}</span>
            </div>
            {task && project && (
              <button
                onClick={() => navigate(`/project/${project.id}?taskId=${task.id}`)}
                className="text-sm opacity-90 hover:opacity-100 underline transition-opacity cursor-pointer"
              >
                {task.title} • {project.title}
              </button>
            )}
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleStop}
            className="bg-white text-red-600 hover:bg-red-50 dark:bg-red-800 dark:text-white dark:hover:bg-red-900"
          >
            <Square className="h-4 w-4 mr-2" />
            Stop
          </Button>
        </div>
      </div>
      {task?.flowDiagram && (
        <div className="fixed top-[48px] left-0 right-0 z-50 bg-muted/80 dark:bg-muted/90 border-b border-border px-4 py-1.5 text-xs text-muted-foreground">
          <div className="flex items-center justify-center gap-1">
            <span>This task has a flow diagram.</span>
            <button
              onClick={() => navigate(`/project/${project?.id}/task/${task.id}/flow`)}
              className="text-primary hover:underline font-medium"
            >
              Click to edit.
            </button>
          </div>
        </div>
      )}
    </>
  );
};

