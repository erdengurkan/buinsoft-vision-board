import { useState } from "react";
import * as React from "react";
import { Task, Priority } from "@/types";
import { teamMembers } from "@/data/mockData";
import { useTaskTimer } from "@/contexts/TaskTimerContext";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { StarRating } from "@/components/ui/star-rating";
import { toast } from "sonner";

interface TaskInlineEditProps {
  task: Task;
  projectId: string;
  option: "work" | "assign" | "deadline" | "priority" | "hardness" | "benefit";
  onSave: (updates: Partial<Task>) => void;
  onClose: () => void;
  mousePosition?: { x: number; y: number } | null;
}

export const TaskInlineEdit = ({ 
  task, 
  projectId, 
  option, 
  onSave, 
  onClose,
  mousePosition 
}: TaskInlineEditProps) => {
  const { startTimer, isRunning, activeTimer } = useTaskTimer();
  const [selectedAssignee, setSelectedAssignee] = useState(task.assignee || "");
  const [selectedDeadline, setSelectedDeadline] = useState<Date | undefined>(
    task.deadline ? new Date(task.deadline) : undefined
  );
  const [selectedPriority, setSelectedPriority] = useState<Priority>(task.priority);
  const [selectedHardness, setSelectedHardness] = useState<number | undefined>(task.hardness);
  const [selectedBenefit, setSelectedBenefit] = useState<number | undefined>(task.benefit);
  const [open, setOpen] = useState(true);

  const handleWorkOnThis = () => {
    if (isRunning && activeTimer?.taskId !== task.id) {
      toast.error("Stop the current timer before starting a new one");
      return;
    }
    startTimer(task.id, projectId);
    toast.success("Timer started");
    setOpen(false);
    onClose();
  };

  const handleSaveAssignee = () => {
    onSave({ assignee: selectedAssignee });
    setOpen(false);
    onClose();
  };

  const handleSaveDeadline = () => {
    onSave({ deadline: selectedDeadline });
    setOpen(false);
    onClose();
  };

  const handleSavePriority = () => {
    onSave({ priority: selectedPriority });
    setOpen(false);
    onClose();
  };

  const handleSaveHardness = () => {
    onSave({ hardness: selectedHardness ?? null });
    setOpen(false);
    onClose();
  };

  const handleSaveBenefit = () => {
    onSave({ benefit: selectedBenefit ?? null });
    setOpen(false);
    onClose();
  };

  const renderContent = () => {
    switch (option) {
      case "work":
        return (
          <div className="space-y-3 p-3">
            <div className="text-sm">
              <p className="font-medium mb-1">Work on this task?</p>
              <p className="text-xs text-muted-foreground">
                This will start a timer for "{task.title}"
              </p>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => { setOpen(false); onClose(); }}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleWorkOnThis}>
                Start Timer
              </Button>
            </div>
          </div>
        );

      case "assign":
        return (
          <div className="space-y-3 p-3 w-64">
            <div className="space-y-2">
              <Label>Assign to</Label>
              <Select value={selectedAssignee} onValueChange={setSelectedAssignee}>
                <SelectTrigger>
                  <SelectValue placeholder="Select assignee" />
                </SelectTrigger>
                <SelectContent>
                  {teamMembers.map((member) => (
                    <SelectItem key={member.id} value={member.name}>
                      {member.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => { setOpen(false); onClose(); }}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleSaveAssignee}>
                Save
              </Button>
            </div>
          </div>
        );

      case "deadline":
        return (
          <div className="space-y-3 p-3">
            <div className="space-y-2">
              <Label>Set deadline</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !selectedDeadline && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDeadline ? (
                      format(selectedDeadline, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDeadline}
                    onSelect={setSelectedDeadline}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex gap-2 justify-end">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => { setSelectedDeadline(undefined); handleSaveDeadline(); }}
              >
                Clear
              </Button>
              <Button variant="outline" size="sm" onClick={() => { setOpen(false); onClose(); }}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleSaveDeadline}>
                Save
              </Button>
            </div>
          </div>
        );

      case "priority":
        return (
          <div className="space-y-3 p-3 w-48">
            <div className="space-y-2">
              <Label>Change Priority</Label>
              <Select value={selectedPriority} onValueChange={(value) => setSelectedPriority(value as Priority)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Low">Low</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => { setOpen(false); onClose(); }}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleSavePriority}>
                Save
              </Button>
            </div>
          </div>
        );

      case "hardness":
        return (
          <div className="space-y-3 p-3 w-48">
            <div className="space-y-2">
              <Label>Set Hardness (Difficulty)</Label>
              <StarRating
                value={selectedHardness || 0}
                onChange={setSelectedHardness}
                size="md"
              />
              {selectedHardness && (
                <p className="text-xs text-muted-foreground">
                  {selectedHardness === 1 && "Very Easy"}
                  {selectedHardness === 2 && "Easy"}
                  {selectedHardness === 3 && "Medium"}
                  {selectedHardness === 4 && "Hard"}
                  {selectedHardness === 5 && "Very Hard"}
                </p>
              )}
            </div>
            <div className="flex gap-2 justify-end">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => { setSelectedHardness(undefined); handleSaveHardness(); }}
              >
                Clear
              </Button>
              <Button variant="outline" size="sm" onClick={() => { setOpen(false); onClose(); }}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleSaveHardness} disabled={!selectedHardness}>
                Save
              </Button>
            </div>
          </div>
        );

      case "benefit":
        return (
          <div className="space-y-3 p-3 w-48">
            <div className="space-y-2">
              <Label>Set Benefit (Value)</Label>
              <StarRating
                value={selectedBenefit || 0}
                onChange={setSelectedBenefit}
                size="md"
              />
              {selectedBenefit && (
                <p className="text-xs text-muted-foreground">
                  {selectedBenefit === 1 && "Very Low"}
                  {selectedBenefit === 2 && "Low"}
                  {selectedBenefit === 3 && "Medium"}
                  {selectedBenefit === 4 && "High"}
                  {selectedBenefit === 5 && "Very High"}
                </p>
              )}
            </div>
            <div className="flex gap-2 justify-end">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => { setSelectedBenefit(undefined); handleSaveBenefit(); }}
              >
                Clear
              </Button>
              <Button variant="outline" size="sm" onClick={() => { setOpen(false); onClose(); }}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleSaveBenefit} disabled={!selectedBenefit}>
                Save
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Auto-open popover when component mounts
  React.useEffect(() => {
    setOpen(true);
  }, []);

  // Auto-open when component mounts
  React.useEffect(() => {
    setOpen(true);
  }, []);

  // Calculate trigger position from mouse position
  const triggerStyle: React.CSSProperties = mousePosition 
    ? {
        position: 'fixed',
        left: `${mousePosition.x}px`,
        top: `${mousePosition.y}px`,
        width: '1px',
        height: '1px',
        opacity: 0,
        pointerEvents: 'none',
        zIndex: -1,
      }
    : { display: 'none' };

  return (
    <Popover open={open} onOpenChange={(isOpen) => { 
      setOpen(isOpen); 
      if (!isOpen) {
        onClose();
      }
    }}>
      <PopoverTrigger asChild>
        <button aria-hidden="true" style={triggerStyle} />
      </PopoverTrigger>
      <PopoverContent 
        className="p-0 w-auto z-[100]" 
        align="start"
        side="right"
        sideOffset={5}
        onInteractOutside={(e) => {
          setOpen(false);
          onClose();
        }}
        onEscapeKeyDown={() => {
          setOpen(false);
          onClose();
        }}
      >
        {renderContent()}
      </PopoverContent>
    </Popover>
  );
};

