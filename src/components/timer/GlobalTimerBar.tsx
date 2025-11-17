import { useTaskTimer } from "@/contexts/TaskTimerContext";
import { useApp } from "@/contexts/AppContext";
import { useWorklog } from "@/hooks/useWorklog";
import { Button } from "@/components/ui/button";
import { Square } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

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
  const { activeTimer, elapsedSeconds, stopTimer, isRunning } = useTaskTimer();
  const { projects } = useApp();
  const { addWorklogEntry } = useWorklog();
  const navigate = useNavigate();

  if (!isRunning || !activeTimer) {
    return null;
  }

  const project = projects.find((p) => p.id === activeTimer.projectId);
  const task = project?.tasks.find((t) => t.id === activeTimer.taskId);

  const handleStop = () => {
    const stoppedAt = new Date();
    const startedAt = new Date(activeTimer.startedAt);
    const durationMs = stoppedAt.getTime() - startedAt.getTime();

    if (durationMs > 0) {
      addWorklogEntry({
        taskId: activeTimer.taskId,
        durationMs,
        startedAt,
        stoppedAt,
        user: "Buinsoft User",
      });
      toast.success(`Timer stopped and logged`);
    }

    stopTimer();
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

