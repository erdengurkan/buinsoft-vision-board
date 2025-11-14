import { useState, useMemo } from "react";
import { Project, Priority, ProjectStatus } from "@/types";
import { isAfter, isBefore, startOfToday, isPast } from "date-fns";

export interface DashboardFilters {
  assignee: string[];
  priority: Priority[];
  status: ProjectStatus[];
  labels: string[];
  followUpRequired: boolean | null;
  deadlineFilter: "all" | "upcoming" | "overdue" | null;
}

export type SortOption = "priority" | "deadline" | "status" | null;

export const useDashboardFilters = (projects: Project[]) => {
  const [filters, setFilters] = useState<DashboardFilters>({
    assignee: [],
    priority: [],
    status: [],
    labels: [],
    followUpRequired: null,
    deadlineFilter: null,
  });

  const [sortBy, setSortBy] = useState<SortOption>(null);

  const filteredAndSortedProjects = useMemo(() => {
    let filtered = [...projects];

    // Apply filters
    if (filters.assignee.length > 0) {
      filtered = filtered.filter((p) => filters.assignee.includes(p.assignee));
    }

    if (filters.priority.length > 0) {
      filtered = filtered.filter((p) => filters.priority.includes(p.priority));
    }

    if (filters.status.length > 0) {
      filtered = filtered.filter((p) => filters.status.includes(p.status));
    }

    if (filters.labels.length > 0) {
      filtered = filtered.filter((p) =>
        p.labels.some((label) => filters.labels.includes(label.id))
      );
    }

    if (filters.followUpRequired === true) {
      filtered = filtered.filter((p) => p.followUp || p.tasks.some((t) => t.followUp));
    }

    if (filters.deadlineFilter === "upcoming") {
      filtered = filtered.filter(
        (p) => p.deadline && isAfter(p.deadline, startOfToday()) && !isPast(p.deadline)
      );
    } else if (filters.deadlineFilter === "overdue") {
      filtered = filtered.filter((p) => p.deadline && isPast(p.deadline));
    }

    // Apply sorting
    if (sortBy === "priority") {
      const priorityOrder: Record<Priority, number> = {
        Critical: 4,
        High: 3,
        Medium: 2,
        Low: 1,
      };
      filtered.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);
    } else if (sortBy === "deadline") {
      filtered.sort((a, b) => {
        if (!a.deadline && !b.deadline) return 0;
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        return a.deadline.getTime() - b.deadline.getTime();
      });
    } else if (sortBy === "status") {
      const statusOrder: Record<ProjectStatus, number> = {
        Potential: 1,
        Active: 2,
        "In Progress": 3,
        Done: 4,
      };
      filtered.sort((a, b) => statusOrder[a.status] - statusOrder[b.status]);
    }

    return filtered;
  }, [projects, filters, sortBy]);

  const updateFilter = <K extends keyof DashboardFilters>(
    key: K,
    value: DashboardFilters[K]
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const toggleFilter = <K extends keyof DashboardFilters>(
    key: K,
    value: string | Priority | ProjectStatus
  ) => {
    setFilters((prev) => {
      const current = prev[key] as any[];
      if (Array.isArray(current)) {
        if (current.includes(value)) {
          return { ...prev, [key]: current.filter((v) => v !== value) };
        } else {
          return { ...prev, [key]: [...current, value] };
        }
      }
      return prev;
    });
  };

  const clearFilters = () => {
    setFilters({
      assignee: [],
      priority: [],
      status: [],
      labels: [],
      followUpRequired: null,
      deadlineFilter: null,
    });
    setSortBy(null);
  };

  const hasActiveFilters = useMemo(() => {
    return (
      filters.assignee.length > 0 ||
      filters.priority.length > 0 ||
      filters.status.length > 0 ||
      filters.labels.length > 0 ||
      filters.followUpRequired !== null ||
      filters.deadlineFilter !== null ||
      sortBy !== null
    );
  }, [filters, sortBy]);

  return {
    filters,
    sortBy,
    filteredAndSortedProjects,
    updateFilter,
    toggleFilter,
    clearFilters,
    setSortBy,
    hasActiveFilters,
  };
};

