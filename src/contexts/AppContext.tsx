import React, { createContext, useContext, ReactNode } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Project } from "@/types";
import { toast } from "sonner";
import { useAuth } from "./AuthContext";

interface AppContextType {
  projects: Project[];
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  addProject: (project: Partial<Project>) => void;
  getProjectById: (id: string) => Project | undefined;
  isLoading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const API_URL = import.meta.env.VITE_API_URL || "/api";

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Note: SSE is handled globally in AppWithSSE component, not here

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["projects", user?.name],
    queryFn: async () => {
      const url = new URL(`${API_URL}/projects`, window.location.origin);
      if (user?.name) {
        url.searchParams.append("userName", user.name);
      }
      console.log("🔍 Fetching projects from:", url.toString());
      const res = await fetch(url.toString());
      if (!res.ok) {
        const errorText = await res.text();
        console.error("❌ Failed to fetch projects:", res.status, errorText);
        throw new Error(`Failed to fetch projects: ${res.status}`);
      }
      const data = await res.json();
      console.log("✅ Projects fetched:", data.length, "projects");
      // Parse date strings to Date objects
      return data.map((project: any) => ({
        ...project,
        startDate: new Date(project.startDate),
        endDate: new Date(project.endDate),
        deadline: project.deadline ? new Date(project.deadline) : undefined,
        tasks: (project.tasks || []).map((task: any) => ({
          ...task,
          deadline: task.deadline ? new Date(task.deadline) : undefined,
          createdAt: task.createdAt ? new Date(task.createdAt) : new Date(),
          // Backend returns 'worklogs' (plural), map to 'worklog' (singular) for frontend
          worklog: (task.worklogs || task.worklog || []).map((log: any) => ({
            ...log,
            startedAt: log.startedAt ? new Date(log.startedAt) : undefined,
            stoppedAt: log.stoppedAt ? new Date(log.stoppedAt) : undefined,
            user: log.user || "Unknown",
            durationMs: log.durationMs || 0,
          })),
        })),
      }));
    },
    enabled: !!user, // Only fetch when user is loaded
    staleTime: 30000, // Consider data fresh for 30 seconds
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnMount: true, // Only refetch on mount
    retry: 2, // Retry failed requests
    // Don't show error if user is not loaded yet (will be handled by ProtectedRoute)
    throwOnError: false,
  });

  const addProjectMutation = useMutation({
    mutationFn: async (project: Partial<Project>) => {
      const res = await fetch(`${API_URL}/projects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(project),
      });
      if (!res.ok) throw new Error("Failed to create project");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Project created successfully");
    },
    onError: () => {
      toast.error("Failed to create project");
    },
  });

  const updateProjectMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Project> }) => {
      // Remove tasks from updates - tasks should be managed via /api/tasks endpoints
      const { tasks, ...projectUpdates } = updates;

      const res = await fetch(`${API_URL}/projects/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(projectUpdates),
      });
      if (!res.ok) throw new Error("Failed to update project");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Project updated successfully");
    },
    onError: () => {
      toast.error("Failed to update project");
    },
  });

  const deleteProjectMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${API_URL}/projects/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete project");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Project deleted successfully");
    },
    onError: () => {
      toast.error("Failed to delete project");
    },
  });

  const addProject = (project: Partial<Project>) => {
    addProjectMutation.mutate(project);
  };

  const updateProject = (id: string, updates: Partial<Project>) => {
    // Note: tasks array is automatically filtered out in updateProjectMutation
    // Tasks should be managed via /api/tasks endpoints
    updateProjectMutation.mutate({ id, updates });
  };

  const deleteProject = (id: string) => {
    deleteProjectMutation.mutate(id);
  };

  const getProjectById = (id: string) => {
    return projects.find((project: Project) => project.id === id);
  };

  return (
    <AppContext.Provider
      value={{
        projects,
        updateProject,
        deleteProject,
        addProject,
        getProjectById,
        isLoading,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within AppProvider");
  }
  return context;
};
