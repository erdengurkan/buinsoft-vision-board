export type Priority = "Low" | "Medium" | "High" | "Critical";
export type ProjectStatus = string;
export type TaskStatus = string;

export interface Label {
  id: string;
  name: string;
  color: string;
}

export interface WorklogEntry {
  id: string;
  taskId: string;
  durationMs: number; // in milliseconds
  startedAt: Date;
  stoppedAt: Date;
  user: string;
  description?: string;
}

export interface FlowDiagram {
  nodes: any[];
  edges: any[];
  viewport?: {
    x: number;
    y: number;
    zoom: number;
  };
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  assignee: string;
  priority: Priority;
  createdAt: Date;
  deadline?: Date;
  followUp: boolean;
  order: number; // Added order field
  hardness?: number; // 1-5 star rating for difficulty
  benefit?: number; // 1-5 star rating for value
  worklog?: WorklogEntry[];
  flowDiagram?: FlowDiagram;
}

export interface Comment {
  id: string;
  projectId: string;
  taskId?: string; // optional link to task
  text: string;
  user: string;
  timestamp: Date;
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
  deadline?: Date;
  followUp: boolean;
  labels: Label[];
  description: string;
  order?: number;
  hardness?: number; // 1-5 star rating for difficulty
  benefit?: number; // 1-5 star rating for value
  sharedWithAll?: boolean; // Herkes görebilsin mi?
  sharedWith?: string[]; // Paylaşılan kullanıcı isimleri listesi
  tasks: Task[];
}

export interface TeamMember {
  id: string;
  name: string;
  role: string | null;
  userRole: string | null;
  email: string;
  avatar: string | null;
}

export interface Contact {
  id: string;
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
}

export type ActivityType =
  | "project_created"
  | "project_edited"
  | "project_status_changed"
  | "task_created"
  | "task_edited"
  | "task_deleted"
  | "task_status_changed"
  | "follow_up_toggled"
  | "deadline_updated";

export interface ActivityLog {
  id: string;
  projectId: string;
  timestamp: Date;
  user: string;
  actionType: ActivityType;
  description: string;
  metadata?: {
    taskId?: string;
    oldStatus?: string;
    newStatus?: string;
    field?: string;
    oldValue?: string;
    newValue?: string;
    [key: string]: any;
  };
}

export interface Todo {
  id: string;
  title: string;
  completed: boolean;
  createdAt: Date;
  deadline?: Date;
  order?: number;
  mentions?: string[]; // Array of user names/ids who are mentioned in this todo
  taskId?: string; // İlişkili task ID'si
  taskTitle?: string; // Task başlığı (hızlı erişim için)
}
