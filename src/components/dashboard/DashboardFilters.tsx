import { Project, Priority, ProjectStatus, Label } from "@/types";
import { teamMembers } from "@/data/mockData";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X, Filter } from "lucide-react";
import { DashboardFilters as FilterType, SortOption } from "@/hooks/useDashboardFilters";
import { cn } from "@/lib/utils";

interface DashboardFiltersProps {
  filters: FilterType;
  sortBy: SortOption;
  projects: Project[];
  onFilterChange: <K extends keyof FilterType>(key: K, value: FilterType[K]) => void;
  onToggleFilter: <K extends keyof FilterType>(
    key: K,
    value: string | Priority | ProjectStatus
  ) => void;
  onSortChange: (sort: SortOption) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
}

// Get unique labels from all projects
const getAllLabels = (projects: Project[]): Label[] => {
  const labelMap = new Map<string, Label>();
  projects.forEach((project) => {
    project.labels.forEach((label) => {
      if (!labelMap.has(label.id)) {
        labelMap.set(label.id, label);
      }
    });
  });
  return Array.from(labelMap.values());
};

export const DashboardFilters = ({
  filters,
  sortBy,
  projects,
  onFilterChange,
  onToggleFilter,
  onSortChange,
  onClearFilters,
  hasActiveFilters,
}: DashboardFiltersProps) => {
  const allLabels = getAllLabels(projects);
  const uniqueAssignees = Array.from(new Set(projects.map((p) => p.assignee)));

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Filters:</span>
        </div>

        {/* Assignee Filter */}
        <Select
          value={filters.assignee.length > 0 ? filters.assignee[0] : "all"}
          onValueChange={(value) => {
            if (value === "all") {
              onFilterChange("assignee", []);
            } else {
              onToggleFilter("assignee", value);
            }
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Assignee" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Assignees</SelectItem>
            {uniqueAssignees.map((assignee) => (
              <SelectItem key={assignee} value={assignee}>
                {assignee}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Priority Filter */}
        <Select
          value={filters.priority.length > 0 ? filters.priority[0] : "all"}
          onValueChange={(value) => {
            if (value === "all") {
              onFilterChange("priority", []);
            } else {
              onToggleFilter("priority", value as Priority);
            }
          }}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            <SelectItem value="Critical">Critical</SelectItem>
            <SelectItem value="High">High</SelectItem>
            <SelectItem value="Medium">Medium</SelectItem>
            <SelectItem value="Low">Low</SelectItem>
          </SelectContent>
        </Select>

        {/* Status Filter */}
        <Select
          value={filters.status.length > 0 ? filters.status[0] : "all"}
          onValueChange={(value) => {
            if (value === "all") {
              onFilterChange("status", []);
            } else {
              onToggleFilter("status", value as ProjectStatus);
            }
          }}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="Potential">Potential</SelectItem>
            <SelectItem value="Active">Active</SelectItem>
            <SelectItem value="In Progress">In Progress</SelectItem>
            <SelectItem value="Done">Done</SelectItem>
          </SelectContent>
        </Select>

        {/* Deadline Filter */}
        <Select
          value={filters.deadlineFilter || "all"}
          onValueChange={(value) => {
            onFilterChange("deadlineFilter", value === "all" ? null : (value as any));
          }}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Deadline" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Deadlines</SelectItem>
            <SelectItem value="upcoming">Upcoming</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
          </SelectContent>
        </Select>

        {/* Follow-up Filter */}
        <Select
          value={filters.followUpRequired === null ? "all" : filters.followUpRequired ? "yes" : "no"}
          onValueChange={(value) => {
            onFilterChange("followUpRequired", value === "all" ? null : value === "yes");
          }}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Follow-up" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="yes">Required</SelectItem>
            <SelectItem value="no">Not Required</SelectItem>
          </SelectContent>
        </Select>

        {/* Sort */}
        <Select value={sortBy || "none"} onValueChange={(value) => onSortChange(value === "none" ? null : (value as SortOption))}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No Sort</SelectItem>
            <SelectItem value="priority">Priority</SelectItem>
            <SelectItem value="deadline">Deadline</SelectItem>
            <SelectItem value="status">Status</SelectItem>
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button variant="outline" size="sm" onClick={onClearFilters}>
            <X className="h-4 w-4 mr-2" />
            Clear All
          </Button>
        )}
      </div>

      {/* Active Filter Pills */}
      {(filters.assignee.length > 0 ||
        filters.priority.length > 0 ||
        filters.status.length > 0 ||
        filters.labels.length > 0 ||
        filters.followUpRequired !== null ||
        filters.deadlineFilter !== null ||
        sortBy !== null) && (
        <div className="flex flex-wrap gap-2">
          {filters.assignee.map((assignee) => (
            <Badge key={assignee} variant="secondary" className="gap-1">
              Assignee: {assignee}
              <button
                onClick={() => onToggleFilter("assignee", assignee)}
                className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          {filters.priority.map((priority) => (
            <Badge key={priority} variant="secondary" className="gap-1">
              Priority: {priority}
              <button
                onClick={() => onToggleFilter("priority", priority)}
                className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          {filters.status.map((status) => (
            <Badge key={status} variant="secondary" className="gap-1">
              Status: {status}
              <button
                onClick={() => onToggleFilter("status", status)}
                className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          {filters.deadlineFilter && (
            <Badge variant="secondary" className="gap-1">
              Deadline: {filters.deadlineFilter}
              <button
                onClick={() => onFilterChange("deadlineFilter", null)}
                className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.followUpRequired !== null && (
            <Badge variant="secondary" className="gap-1">
              Follow-up: {filters.followUpRequired ? "Required" : "Not Required"}
              <button
                onClick={() => onFilterChange("followUpRequired", null)}
                className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {sortBy && (
            <Badge variant="secondary" className="gap-1">
              Sort: {sortBy}
              <button
                onClick={() => onSortChange(null)}
                className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
};

