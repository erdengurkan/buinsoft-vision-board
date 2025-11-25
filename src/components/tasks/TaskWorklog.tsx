import { useState, useEffect } from "react";
import { WorklogEntry } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Play, Square, Clock, User, Trash2, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useTaskTimer } from "@/contexts/TaskTimerContext";
import { useApp } from "@/contexts/AppContext";
import { useActiveTimers } from "@/hooks/useActiveTimers";
import { useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

interface TaskWorklogProps {
  taskId: string;
  projectId: string;
  worklog: WorklogEntry[];
  onAddWorklog: (entry: Omit<WorklogEntry, "id">) => void;
  onDeleteWorklog: (entryId: string) => void;
  compact?: boolean;
}

const DEFAULT_USER = "Emre Kılınç"; // TODO: Get from auth context

const formatDuration = (seconds: number): string => {
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

const formatDurationFromMs = (ms: number): string => {
  return formatDuration(Math.floor(ms / 1000));
};

export const TaskWorklog = ({
  taskId,
  projectId,
  worklog,
  onAddWorklog,
  onDeleteWorklog,
  compact = false,
}: TaskWorklogProps) => {
  const { activeTimer, elapsedSeconds, startTimer, stopTimer, isRunning: localTimerRunning } = useTaskTimer();
  const { projects } = useApp();
  const queryClient = useQueryClient();
  const { data: backendTimers = [] } = useActiveTimers(projectId);
  const [description, setDescription] = useState("");
  const [showWarning, setShowWarning] = useState(false);
  const [pendingTaskId, setPendingTaskId] = useState<string | null>(null);

  // Check for active timers from backend (for current user)
  const backendActiveTimer = backendTimers.find(t => t.userId === DEFAULT_USER);
  const isThisTaskActive = activeTimer?.taskId === taskId || backendActiveTimer?.taskId === taskId;
  const isOtherTaskActive = (localTimerRunning && !isThisTaskActive) || (backendActiveTimer && backendActiveTimer.taskId !== taskId);

  const handleStart = () => {
    if (isOtherTaskActive) {
      const activeTimerToShow = activeTimer || (backendActiveTimer ? {
        taskId: backendActiveTimer.taskId,
        projectId: backendActiveTimer.projectId,
        startedAt: new Date(backendActiveTimer.startedAt).getTime(),
      } : null);
      
      const activeProject = projects.find((p) => p.id === activeTimerToShow?.projectId);
      const activeTask = activeProject?.tasks.find((t) => t.id === activeTimerToShow?.taskId);
      setPendingTaskId(taskId);
      setShowWarning(true);
      return;
    }

    startTimer(taskId, projectId);
    toast.success("Timer started");
  };

  const handleStop = async () => {
    const timerToStop = activeTimer || (backendActiveTimer ? {
      taskId: backendActiveTimer.taskId,
      projectId: backendActiveTimer.projectId,
      startedAt: new Date(backendActiveTimer.startedAt).getTime(),
    } : null);

    if (!timerToStop || timerToStop.taskId !== taskId) {
      // Timer might have been stopped from GlobalTimerBar or doesn't belong to this task
      return;
    }

    const stoppedAt = new Date();
    const startedAt = new Date(timerToStop.startedAt);
    const durationMs = stoppedAt.getTime() - startedAt.getTime();

    // FIRST: Stop backend timer (this will broadcast timer_stopped event to all clients)
    try {
      await api.post("/timers/stop", {
        userId: DEFAULT_USER,
        taskId: taskId,
      });
    } catch (error) {
      console.error("Error stopping backend timer:", error);
    }

    // SECOND: Stop local timer (clears local state)
    await stopTimer();
    setDescription("");

    // THIRD: Save worklog if duration is valid
    if (durationMs > 0) {
      try {
        const savedWorklog = await api.post("/worklogs", {
          taskId,
          durationMs,
          startedAt: startedAt.toISOString(),
          stoppedAt: stoppedAt.toISOString(),
          user: DEFAULT_USER,
          description: description.trim() || undefined,
        });
        
        // Also call onAddWorklog for local state update
        onAddWorklog({
          taskId,
          durationMs,
          startedAt,
          stoppedAt,
          user: DEFAULT_USER,
          description: description.trim() || undefined,
        });

        // Invalidate queries to refresh data
        queryClient.invalidateQueries({ queryKey: ['projects'] });
        queryClient.invalidateQueries({ queryKey: ['activeTimers'] });
        
        toast.success(`Logged ${formatDurationFromMs(durationMs)}`);
      } catch (error) {
        console.error("Failed to save worklog:", error);
        toast.error("Failed to save worklog to server");
      }
    }
  };

  const handleSwitchTimer = () => {
    if (activeTimer && activeTimer.taskId !== taskId) {
      // Note: The previous timer's worklog should be saved by its own TaskWorklog component
      // This just switches to the new timer
      toast.info("Switching timer - previous timer will need to be saved separately");
    }

    stopTimer();
    setShowWarning(false);
    if (pendingTaskId) {
      startTimer(pendingTaskId, projectId);
      setPendingTaskId(null);
    }
  };

  const totalTimeMs = worklog.reduce((sum, entry) => sum + entry.durationMs, 0);
  const totalTimeSeconds = Math.floor(totalTimeMs / 1000);
  const currentElapsed = isThisTaskActive ? elapsedSeconds : 0;
  const totalTime = totalTimeSeconds + currentElapsed;

  if (compact) {
    return (
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="text-lg font-mono font-bold">
              {isThisTaskActive ? formatDuration(currentElapsed) : "0:00"}
            </span>
            {isThisTaskActive && (
              <span className="text-xs text-red-600 dark:text-red-400 font-medium whitespace-nowrap">
                🔴 Running
              </span>
            )}
          </div>
          <div className="text-sm text-muted-foreground whitespace-nowrap">
            Total: {formatDuration(totalTime)}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {!isThisTaskActive ? (
            <>
              <Input
                id="description-compact"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What are you working on?"
                className="h-8 w-40 text-xs"
                disabled={isOtherTaskActive}
              />
              <Button 
                onClick={handleStart} 
                size="sm" 
                className="gap-1.5"
                disabled={isOtherTaskActive}
              >
                <Play className="h-3.5 w-3.5" />
                Start
              </Button>
            </>
          ) : (
            <>
              <Input
                id="description-compact"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What are you working on?"
                className="h-8 w-40 text-xs"
                disabled={true}
              />
              <Button onClick={handleStop} size="sm" variant="destructive" className="gap-1.5">
                <Square className="h-3.5 w-3.5" />
                Stop
              </Button>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Time Tracking</span>
          <span className="text-lg font-normal text-muted-foreground">
            Total: {formatDuration(totalTime)}
          </span>
        </CardTitle>
        <CardDescription>Track time spent on this task</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Timer Controls */}
        <div className="space-y-3 p-4 border border-border rounded-lg bg-muted/30">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-2xl font-mono font-bold">
                  {isThisTaskActive ? formatDuration(currentElapsed) : "0:00"}
                </span>
                {isThisTaskActive && (
                  <span className="text-xs text-red-600 dark:text-red-400 font-medium">
                    🔴 Running
                  </span>
                )}
              </div>
              <Label htmlFor="description" className="text-xs">
                Description (optional)
              </Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What are you working on?"
                className="mt-1"
                disabled={isThisTaskActive}
              />
            </div>
            <div className="flex flex-col gap-2">
              {!isThisTaskActive ? (
                <Button 
                  onClick={handleStart} 
                  size="lg" 
                  className="gap-2"
                  disabled={isOtherTaskActive}
                >
                  <Play className="h-4 w-4" />
                  Start Timer
                </Button>
              ) : (
                <Button onClick={handleStop} size="lg" variant="destructive" className="gap-2">
                  <Square className="h-4 w-4" />
                  Stop & Save
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Worklog List */}
        {worklog.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Worklog History</h4>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {worklog
                .sort((a, b) => b.stoppedAt.getTime() - a.stoppedAt.getTime())
                .map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <User className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm font-medium">{entry.user}</span>
                        <span className="text-xs text-muted-foreground">
                          {format(entry.stoppedAt, "MMM d, yyyy HH:mm")}
                        </span>
                      </div>
                      {entry.description && (
                        <p className="text-xs text-muted-foreground ml-5">{entry.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium">{formatDurationFromMs(entry.durationMs)}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => onDeleteWorklog(entry.id)}
                      >
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {worklog.length === 0 && !isThisTaskActive && (
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No time logged yet</p>
          </div>
        )}
      </CardContent>

      <AlertDialog open={showWarning} onOpenChange={setShowWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              Another Timer is Running
            </AlertDialogTitle>
            <AlertDialogDescription>
              {(() => {
                const activeTimerToShow = activeTimer || (backendActiveTimer ? {
                  taskId: backendActiveTimer.taskId,
                  projectId: backendActiveTimer.projectId,
                  startedAt: new Date(backendActiveTimer.startedAt).getTime(),
                } : null);
                
                const activeProject = projects.find((p) => p.id === activeTimerToShow?.projectId);
                const activeTask = activeProject?.tasks.find((t) => t.id === activeTimerToShow?.taskId);
                return `You are currently tracking time on "${activeTask?.title || "Unknown Task"}" in project "${activeProject?.title || "Unknown Project"}". Stop it first or switch to this task.`;
              })()}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowWarning(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSwitchTimer} className="bg-orange-600 hover:bg-orange-700">
              Switch Timer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

