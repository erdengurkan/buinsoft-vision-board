export interface StatusColumn {
  id: string;
  name: string;
  color: string;
  order: number;
}

export interface WorkflowConfig {
  projectStatuses: StatusColumn[];
  taskStatuses: StatusColumn[];
}
