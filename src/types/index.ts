export type Priority = "Low" | "Medium" | "High";
export type ProjectStatus = "Potential" | "Active" | "In Progress" | "Done";
export type TaskStatus = "Todo" | "In Progress" | "Testing" | "Completed";

export interface Label {
  id: string;
  name: string;
  color: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  assignee: string;
  priority: Priority;
  createdAt: Date;
}

export interface Project {
  id: string;
  title: string;
  client: string;
  assignee: string;
  priority: Priority;
  status: ProjectStatus;
  startDate: Date;
  endDate: Date;
  labels: Label[];
  description: string;
  tasks: Task[];
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  email: string;
  avatar: string;
}

export interface Contact {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
}
