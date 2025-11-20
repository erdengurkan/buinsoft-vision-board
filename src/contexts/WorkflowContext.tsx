import React, { createContext, useContext, ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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

const API_URL = import.meta.env.VITE_API_URL || "/api";

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
  const queryClient = useQueryClient();
  
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
    staleTime: 60000, // Consider data fresh for 1 minute
    refetchOnWindowFocus: false, // Don't refetch on window focus
  });

  // Parse statuses from backend or use defaults
  const allStatuses = data?.statuses || [];
  
  // If backend returns statuses, use them; otherwise use defaults
  let projectStatuses: StatusColumn[] = defaultProjectStatuses;
  let taskStatuses: StatusColumn[] = defaultTaskStatuses;
  
  if (allStatuses.length > 0) {
    // Backend statuses have type field
    const backendProjectStatuses = allStatuses.filter((s: any) => s.type === 'project');
    const backendTaskStatuses = allStatuses.filter((s: any) => s.type === 'task');
    
    // Convert backend format to StatusColumn format
    projectStatuses = backendProjectStatuses.length > 0 
      ? backendProjectStatuses.map((s: any) => ({
          id: s.id,
          name: s.name,
          color: s.color,
          order: s.order,
        }))
      : defaultProjectStatuses;
      
    taskStatuses = backendTaskStatuses.length > 0
      ? backendTaskStatuses.map((s: any) => ({
          id: s.id,
          name: s.name,
          color: s.color,
          order: s.order,
        }))
      : defaultTaskStatuses;
  }
  
  const labels = data?.labels || defaultLabels;

  // Task Status CRUD functions
  const addTaskStatus = async (status: Omit<StatusColumn, "id" | "order">) => {
    try {
      const url = `${API_URL}/workflow/status`;
      const payload = {
        ...status,
        type: "task",
      };
      console.log('🔍 POST Request to:', url);
      console.log('📦 Payload:', payload);
      console.log('🌐 API_URL:', API_URL);
      
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      
      console.log('📡 Response status:', res.status, res.statusText);
      console.log('📡 Response URL:', res.url);
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "Failed to create status" }));
        console.error("Failed to add task status:", res.status, errorData);
        throw new Error(errorData.error || "Failed to create status");
      }
      
      const newStatus = await res.json();
      console.log("Status created successfully:", newStatus);
      queryClient.invalidateQueries({ queryKey: ["workflow"] });
      return newStatus;
    } catch (error) {
      console.error("Failed to add task status:", error);
      throw error;
    }
  };

  const updateTaskStatus = async (id: string, updates: Partial<StatusColumn>) => {
    try {
      const res = await fetch(`${API_URL}/workflow/status/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error("Failed to update status");
      queryClient.invalidateQueries({ queryKey: ["workflow"] });
    } catch (error) {
      console.error("Failed to update task status:", error);
      throw error;
    }
  };

  const deleteTaskStatus = async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/workflow/status/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to delete status");
      }
      queryClient.invalidateQueries({ queryKey: ["workflow"] });
    } catch (error) {
      console.error("Failed to delete task status:", error);
      throw error;
    }
  };

  const reorderTaskStatuses = async (statuses: StatusColumn[]) => {
    try {
      // Update orders for all statuses
      await Promise.all(
        statuses.map((status, index) =>
          updateTaskStatus(status.id, { order: index })
        )
      );
      queryClient.invalidateQueries({ queryKey: ["workflow"] });
    } catch (error) {
      console.error("Failed to reorder task statuses:", error);
      throw error;
    }
  };

  // Placeholder functions for project statuses and labels (not implemented yet)
  const addProjectStatus = () => { };
  const updateProjectStatus = () => { };
  const deleteProjectStatus = () => { };
  const reorderProjectStatuses = () => { };
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
