import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Project } from "@/types";
import { initialProjects } from "@/data/mockData";

interface AppContextType {
  projects: Project[];
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  addProject: (project: Project) => void;
  getProjectById: (id: string) => Project | undefined;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEY = "buinsoft-vision-board-projects";

// Helper function to serialize projects for localStorage
// JSON.stringify automatically converts Date objects to ISO strings
const serializeProjects = (projects: Project[]): string => {
  return JSON.stringify(projects);
};

// Helper function to deserialize projects from localStorage
// Convert ISO date strings back to Date objects
const deserializeProjects = (json: string): Project[] => {
  const parsed = JSON.parse(json);
  return parsed.map((project: any) => ({
    ...project,
    startDate: new Date(project.startDate),
    endDate: new Date(project.endDate),
    deadline: project.deadline ? new Date(project.deadline) : undefined,
    tasks: project.tasks.map((task: any) => ({
      ...task,
      createdAt: new Date(task.createdAt),
      deadline: task.deadline ? new Date(task.deadline) : undefined,
    })),
  }));
};

// Load projects from localStorage or use initial data
const loadProjects = (): Project[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return deserializeProjects(stored);
    }
  } catch (error) {
    console.error("Error loading projects from localStorage:", error);
  }
  return initialProjects;
};

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [projects, setProjects] = useState<Project[]>(loadProjects);

  // Save projects to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, serializeProjects(projects));
    } catch (error) {
      console.error("Error saving projects to localStorage:", error);
    }
  }, [projects]);

  const updateProject = (id: string, updates: Partial<Project>) => {
    setProjects((prev) =>
      prev.map((project) =>
        project.id === id ? { ...project, ...updates } : project
      )
    );
  };

  const deleteProject = (id: string) => {
    setProjects((prev) => prev.filter((project) => project.id !== id));
  };

  const addProject = (project: Project) => {
    setProjects((prev) => [...prev, project]);
  };

  const getProjectById = (id: string) => {
    return projects.find((project) => project.id === id);
  };

  return (
    <AppContext.Provider
      value={{
        projects,
        updateProject,
        deleteProject,
        addProject,
        getProjectById,
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
