import React, { createContext, useContext, ReactNode } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Project } from "@/types";
import { toast } from "sonner";

interface AppContextType {
  projects: Project[];
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  addProject: (project: Project) => void;
  getProjectById: (id: string) => Project | undefined;
  isLoading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const API_URL = import.meta.env.VITE_API_URL || "/api";

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/projects`);
      if (!res.ok) throw new Error("Failed to fetch projects");
      return res.json();
    },
  });

  const addProjectMutation = useMutation({
    mutationFn: async (project: Project) => {
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
      const res = await fetch(`${API_URL}/projects/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
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

  const addProject = (project: Project) => {
    addProjectMutation.mutate(project);
  };

  const updateProject = (id: string, updates: Partial<Project>) => {
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
