import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, X } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Project, Priority, ProjectStatus } from "@/types";
import { useState, useEffect } from "react";
import { teamMembers } from "@/data/mockData";
import { useWorkflow } from "@/contexts/WorkflowContext";

interface ProjectFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project?: Project;
  onSave: (project: Partial<Project>) => void;
}

export const ProjectFormModal = ({ open, onOpenChange, project, onSave }: ProjectFormModalProps) => {
  const { projectStatuses, labels: availableLabels } = useWorkflow();
  const [formData, setFormData] = useState<Partial<Project>>({
    title: "",
    client: "",
    assignee: teamMembers[0].name,
    priority: "Medium" as Priority,
    status: projectStatuses[0]?.name || "Potential",
    description: "",
    startDate: new Date(),
    endDate: new Date(),
    deadline: undefined,
    followUp: false,
    labels: [],
  });

  useEffect(() => {
    if (project) {
      setFormData(project);
    } else {
      setFormData({
        title: "",
        client: "",
        assignee: teamMembers[0].name,
        priority: "Medium" as Priority,
        status: projectStatuses[0]?.name || "Potential",
        description: "",
        startDate: new Date(),
        endDate: new Date(),
        deadline: undefined,
        followUp: false,
        labels: [],
      });
    }
  }, [project, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onOpenChange(false);
  };

  const toggleLabel = (labelId: string) => {
    const label = availableLabels.find((l) => l.id === labelId);
    if (!label) return;

    const hasLabel = formData.labels?.some((l) => l.id === labelId);
    if (hasLabel) {
      setFormData({
        ...formData,
        labels: formData.labels?.filter((l) => l.id !== labelId) || [],
      });
    } else {
      setFormData({
        ...formData,
        labels: [...(formData.labels || []), label],
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{project ? "Edit Project" : "Create Project"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Project Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="client">Client *</Label>
              <Input
                id="client"
                value={formData.client}
                onChange={(e) => setFormData({ ...formData, client: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="assignee">Assigned To</Label>
              <Select value={formData.assignee} onValueChange={(value) => setFormData({ ...formData, assignee: value })}>
                <SelectTrigger>
                  <SelectValue />
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
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {projectStatuses.map((status) => (
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

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.startDate ? format(formData.startDate, "PPP") : <span>Pick date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.startDate}
                    onSelect={(date) => setFormData({ ...formData, startDate: date || new Date() })}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.endDate ? format(formData.endDate, "PPP") : <span>Pick date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.endDate}
                    onSelect={(date) => setFormData({ ...formData, endDate: date || new Date() })}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>Deadline (Optional)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.deadline ? format(formData.deadline, "PPP") : <span>Optional</span>}
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
          </div>

          <div className="space-y-2">
            <Label>Labels</Label>
            <div className="flex flex-wrap gap-2">
              {availableLabels.map((label) => (
                <Badge
                  key={label.id}
                  className={cn(
                    "cursor-pointer",
                    label.color,
                    "text-white",
                    formData.labels?.some((l) => l.id === label.id) ? "ring-2 ring-primary" : "opacity-50"
                  )}
                  onClick={() => toggleLabel(label.id)}
                >
                  {label.name}
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
            />
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

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">{project ? "Update" : "Create"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
