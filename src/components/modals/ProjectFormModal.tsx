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
import { Checkbox } from "@/components/ui/checkbox";
import { CalendarIcon, X, Users } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Project, Priority, ProjectStatus } from "@/types";
import { useState, useEffect } from "react";
import { teamMembers } from "@/data/mockData";
import { useWorkflow } from "@/contexts/WorkflowContext";
import { useQuery } from "@tanstack/react-query";

interface ProjectFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project?: Project;
  onSave: (project: Partial<Project>) => void;
}

const API_URL = import.meta.env.VITE_API_URL || "/api";

export const ProjectFormModal = ({ open, onOpenChange, project, onSave }: ProjectFormModalProps) => {
  const { projectStatuses, labels: availableLabels } = useWorkflow();
  const [sharedWithOpen, setSharedWithOpen] = useState(false);
  
  // Fetch users from API
  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/users`);
      if (!res.ok) throw new Error("Failed to fetch users");
      return res.json();
    },
  });

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
    sharedWithAll: true,
    sharedWith: [],
  });

  useEffect(() => {
    if (project) {
      setFormData({
        ...project,
        sharedWithAll: project.sharedWithAll !== undefined ? project.sharedWithAll : true,
        sharedWith: project.sharedWith || [],
      });
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
        sharedWithAll: true,
        sharedWith: [],
      });
    }
  }, [project, open, projectStatuses]);

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

  const toggleSharedUser = (userName: string) => {
    const currentShared = formData.sharedWith || [];
    if (currentShared.includes(userName)) {
      setFormData({
        ...formData,
        sharedWith: currentShared.filter((u) => u !== userName),
      });
    } else {
      setFormData({
        ...formData,
        sharedWith: [...currentShared, userName],
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto p-3 sm:p-4 md:p-6">
        <DialogHeader className="pb-2 sm:pb-4">
          <DialogTitle className="text-base sm:text-lg">{project ? "Edit Project" : "Create Project"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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

          {/* Shared With Section */}
          <div className="space-y-3 border-t pt-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="sharedWithAll"
                checked={formData.sharedWithAll !== false}
                onCheckedChange={(checked) => {
                  setFormData({
                    ...formData,
                    sharedWithAll: checked,
                    sharedWith: checked ? [] : formData.sharedWith || [],
                  });
                }}
              />
              <Label htmlFor="sharedWithAll" className="cursor-pointer">
                Share with all users
              </Label>
            </div>

            {!formData.sharedWithAll && (
              <div className="space-y-2">
                <Label>Share with specific users</Label>
                <Popover open={sharedWithOpen} onOpenChange={setSharedWithOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        (!formData.sharedWith || formData.sharedWith.length === 0) && "text-muted-foreground"
                      )}
                    >
                      <Users className="mr-2 h-4 w-4" />
                      {formData.sharedWith && formData.sharedWith.length > 0
                        ? `${formData.sharedWith.length} user${formData.sharedWith.length > 1 ? "s" : ""} selected`
                        : "Select users"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-2" align="start">
                    <div className="space-y-1 max-h-64 overflow-y-auto">
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Select users</div>
                      {users.map((user: any) => (
                        <div
                          key={user.id}
                          className="flex items-center gap-2 px-2 py-1.5 hover:bg-muted rounded-md cursor-pointer"
                          onClick={() => toggleSharedUser(user.name || user.email)}
                        >
                          <Checkbox
                            checked={formData.sharedWith?.includes(user.name || user.email) || false}
                            onCheckedChange={() => toggleSharedUser(user.name || user.email)}
                          />
                          <span className="text-sm">{user.name || user.email}</span>
                        </div>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
                {formData.sharedWith && formData.sharedWith.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {formData.sharedWith.map((userName) => (
                      <Badge key={userName} variant="secondary" className="text-xs">
                        {userName}
                        <button
                          onClick={() => toggleSharedUser(userName)}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-3 sm:pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto min-h-[44px]">
              Cancel
            </Button>
            <Button type="submit" className="w-full sm:w-auto min-h-[44px]">{project ? "Update" : "Create"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
