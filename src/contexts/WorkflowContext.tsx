import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { Label } from "@/types";
import { StatusColumn, WorkflowConfig } from "@/types/workflow";

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
}

const WorkflowContext = createContext<WorkflowContextType | undefined>(undefined);

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
  const [projectStatuses, setProjectStatuses] = useState<StatusColumn[]>(() => {
    const saved = localStorage.getItem("projectStatuses");
    return saved ? JSON.parse(saved) : defaultProjectStatuses;
  });

  const [taskStatuses, setTaskStatuses] = useState<StatusColumn[]>(() => {
    const saved = localStorage.getItem("taskStatuses");
    return saved ? JSON.parse(saved) : defaultTaskStatuses;
  });

  const [labels, setLabels] = useState<Label[]>(() => {
    const saved = localStorage.getItem("workflowLabels");
    return saved ? JSON.parse(saved) : defaultLabels;
  });

  useEffect(() => {
    localStorage.setItem("projectStatuses", JSON.stringify(projectStatuses));
  }, [projectStatuses]);

  useEffect(() => {
    localStorage.setItem("taskStatuses", JSON.stringify(taskStatuses));
  }, [taskStatuses]);

  useEffect(() => {
    localStorage.setItem("workflowLabels", JSON.stringify(labels));
  }, [labels]);

  const addProjectStatus = (status: Omit<StatusColumn, "id" | "order">) => {
    const newStatus: StatusColumn = {
      ...status,
      id: `status-${Date.now()}`,
      order: projectStatuses.length,
    };
    setProjectStatuses([...projectStatuses, newStatus]);
  };

  const updateProjectStatus = (id: string, updates: Partial<StatusColumn>) => {
    setProjectStatuses((prev) =>
      prev.map((status) => (status.id === id ? { ...status, ...updates } : status))
    );
  };

  const deleteProjectStatus = (id: string) => {
    setProjectStatuses((prev) => prev.filter((status) => status.id !== id));
  };

  const reorderProjectStatuses = (statuses: StatusColumn[]) => {
    const reordered = statuses.map((status, index) => ({ ...status, order: index }));
    setProjectStatuses(reordered);
  };

  const addTaskStatus = (status: Omit<StatusColumn, "id" | "order">) => {
    const newStatus: StatusColumn = {
      ...status,
      id: `task-status-${Date.now()}`,
      order: taskStatuses.length,
    };
    setTaskStatuses([...taskStatuses, newStatus]);
  };

  const updateTaskStatus = (id: string, updates: Partial<StatusColumn>) => {
    setTaskStatuses((prev) =>
      prev.map((status) => (status.id === id ? { ...status, ...updates } : status))
    );
  };

  const deleteTaskStatus = (id: string) => {
    setTaskStatuses((prev) => prev.filter((status) => status.id !== id));
  };

  const reorderTaskStatuses = (statuses: StatusColumn[]) => {
    const reordered = statuses.map((status, index) => ({ ...status, order: index }));
    setTaskStatuses(reordered);
  };

  const addLabel = (label: Omit<Label, "id">) => {
    const newLabel: Label = {
      ...label,
      id: `label-${Date.now()}`,
    };
    setLabels([...labels, newLabel]);
  };

  const updateLabel = (id: string, updates: Partial<Label>) => {
    setLabels((prev) =>
      prev.map((label) => (label.id === id ? { ...label, ...updates } : label))
    );
  };

  const deleteLabel = (id: string) => {
    setLabels((prev) => prev.filter((label) => label.id !== id));
  };

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
