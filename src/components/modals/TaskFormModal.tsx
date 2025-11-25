import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Task, Priority, TaskStatus } from "@/types";
import { useState, useEffect } from "react";
import { teamMembers } from "@/data/mockData";
import { useWorkflow } from "@/contexts/WorkflowContext";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

interface TaskFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: Task;
  defaultStatus?: string;
  onSave: (task: Partial<Task>) => void;
}

export const TaskFormModal = ({ open, onOpenChange, task, defaultStatus, onSave }: TaskFormModalProps) => {
  const { taskStatuses } = useWorkflow();
  
  // Fetch users from API
  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      return api.get("/users");
    },
  });

  const [formData, setFormData] = useState<Partial<Task>>({
    title: "",
    description: "",
    assignee: "",
    priority: "Medium" as Priority,
    status: taskStatuses[0]?.name || "Todo",
    deadline: undefined,
    followUp: false,
  });

  useEffect(() => {
    if (task) {
      setFormData(task);
    } else {
      setFormData({
        title: "",
        description: "",
        assignee: "",
        priority: "Medium" as Priority,
        status: defaultStatus || taskStatuses[0]?.name || "Todo",
        deadline: undefined,
        followUp: false,
      });
    }
  }, [task, open, defaultStatus, taskStatuses]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-lg max-h-[95vh] sm:max-h-[90vh] overflow-y-auto p-3 sm:p-4 md:p-6">
        <DialogHeader className="pb-2 sm:pb-4">
          <DialogTitle className="text-base sm:text-lg">{task ? "Edit Task" : "Create Task"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Task Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !task && formData.title?.trim()) {
                  e.preventDefault();
                  handleSubmit(e as any);
                }
              }}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="assignee">Assigned To</Label>
              <Select value={formData.assignee || ""} onValueChange={(value) => setFormData({ ...formData, assignee: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a user" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {users.map((user: any) => (
                    <SelectItem key={user.id} value={user.name || user.email}>
                      {user.name || user.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {taskStatuses.map((status) => (
                    <SelectItem key={status.id} value={status.name}>
                      {status.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="priority">Priority</Label>
            <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value as Priority })}>
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

          <div className="space-y-2">
            <Label>Deadline (Optional)</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full justify-start text-left font-normal")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.deadline ? format(formData.deadline, "PPP") : <span>No deadline</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formData.deadline}
                  onSelect={(date) => setFormData({ ...formData, deadline: date })}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="followUp"
              checked={formData.followUp}
              onCheckedChange={(checked) => setFormData({ ...formData, followUp: checked })}
            />
            <Label htmlFor="followUp" className="cursor-pointer">
              Requires Follow-up
            </Label>
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-3 sm:pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto min-h-[44px]">
              Cancel
            </Button>
            <Button type="submit" className="w-full sm:w-auto min-h-[44px]">{task ? "Update" : "Create"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
