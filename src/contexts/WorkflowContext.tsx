import React, { createContext, useContext, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Label } from "@/types";
import { StatusColumn } from "@/types/workflow";

interface WorkflowContextType {
  projectStatuses: StatusColumn[];
  taskStatuses: StatusColumn[];
  labels: Label[];
  addProjectStatus: (status: Omit<StatusColumn, "id" | "order">) => void;
  updateProjectStatus: (id: string, updates: Partial<StatusColumn>) => void;
  deleteProjectStatus: (id: string) => void;
  reorderProjectStatuses: (statuses: StatusColumn[]) => void;
  addTaskStatus: (status: Omit<StatusColumn, "id" | "order">) => void;
  updateTaskStatus: (id: string, updates: Partial<StatusColumn>) => void;
  deleteTaskStatus: (id: string) => void;
  reorderTaskStatuses: (statuses: StatusColumn[]) => void;
  addLabel: (label: Omit<Label, "id">) => void;
  updateLabel: (id: string, updates: Partial<Label>) => void;
  deleteLabel: (id: string) => void;
  isLoading: boolean;
}

const WorkflowContext = createContext<WorkflowContextType | undefined>(undefined);

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

const defaultProjectStatuses: StatusColumn[] = [
  { id: "potential", name: "Potential", color: "bg-blue-500", order: 0 },
  { id: "active", name: "Active", color: "bg-green-500", order: 1 },
  { id: "in-progress", name: "In Progress", color: "bg-yellow-500", order: 2 },
  { id: "done", name: "Done", color: "bg-purple-500", order: 3 },
];

const defaultTaskStatuses: StatusColumn[] = [
  { id: "todo", name: "Todo", color: "bg-blue-500", order: 0 },
  { id: "in-progress", name: "In Progress", color: "bg-yellow-500", order: 1 },
  { id: "testing", name: "Testing", color: "bg-orange-500", order: 2 },
  { id: "completed", name: "Completed", color: "bg-green-500", order: 3 },
];

const defaultLabels: Label[] = [
  { id: "1", name: "Automation", color: "bg-blue-500" },
  { id: "2", name: "API", color: "bg-green-500" },
  { id: "3", name: "Web", color: "bg-purple-500" },
  { id: "4", name: "RPA", color: "bg-orange-500" },
  { id: "5", name: "Mobile", color: "bg-pink-500" },
  { id: "6", name: "Backend", color: "bg-indigo-500" },
];

export const WorkflowProvider = ({ children }: { children: ReactNode }) => {
  const { data, isLoading } = useQuery({
    queryKey: ["workflow"],
    queryFn: async () => {
      try {
        const res = await fetch(`${API_URL}/workflow`);
        if (!res.ok) throw new Error("Failed to fetch workflow");
        return res.json();
      } catch (e) {
        // Fallback to defaults if API fails (e.g. during initial setup)
        return {
          statuses: [...defaultProjectStatuses, ...defaultTaskStatuses],
          labels: defaultLabels
        };
      }
    },
  });

  // For now, we'll use defaults or fetched data. 
  // Full CRUD for workflow statuses would require more backend work.
  const projectStatuses = defaultProjectStatuses;
  const taskStatuses = defaultTaskStatuses;
  const labels = data?.labels || defaultLabels;

  // Placeholder functions for now
  const addProjectStatus = () => { };
  const updateProjectStatus = () => { };
  const deleteProjectStatus = () => { };
  const reorderProjectStatuses = () => { };
  const addTaskStatus = () => { };
  const updateTaskStatus = () => { };
  const deleteTaskStatus = () => { };
  const reorderTaskStatuses = () => { };
  const addLabel = () => { };
  const updateLabel = () => { };
  const deleteLabel = () => { };

  return (
    <WorkflowContext.Provider
      value={{
        projectStatuses,
        taskStatuses,
        labels,
        addProjectStatus,
        updateProjectStatus,
        deleteProjectStatus,
        reorderProjectStatuses,
        addTaskStatus,
        updateTaskStatus,
        deleteTaskStatus,
        reorderTaskStatuses,
        addLabel,
        updateLabel,
        deleteLabel,
        isLoading,
      }}
    >
      {children}
    </WorkflowContext.Provider>
  );
};

export const useWorkflow = () => {
  const context = useContext(WorkflowContext);
  if (!context) {
    throw new Error("useWorkflow must be used within WorkflowProvider");
  }
  return context;
};
