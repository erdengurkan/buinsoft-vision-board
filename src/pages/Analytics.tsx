import { useApp } from "@/contexts/AppContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer
} from "recharts";
import { TaskStatus, Priority, ProjectStatus } from "@/types";
import { isPast, isAfter, startOfToday } from "date-fns";
import { format } from "date-fns";
import { AlertCircle, Calendar, CheckCircle2, Clock, Flag, TrendingUp } from "lucide-react";

const COLORS = {
  priority: {
    Critical: "#dc2626",
    High: "#ea580c",
    Medium: "#f59e0b",
    Low: "#10b981",
  },
  status: {
    Todo: "#94a3b8",
    "In Progress": "#3b82f6",
    Testing: "#8b5cf6",
    Completed: "#10b981",
  },
  projectStatus: {
    Potential: "#94a3b8",
    Active: "#3b82f6",
    "In Progress": "#8b5cf6",
    Done: "#10b981",
  },
};

export default function Analytics() {
  const { projects } = useApp();

  // Calculate statistics
  const totalProjects = projects.length;
  const activeProjects = projects.filter(
    (p) => p.status !== "Done"
  ).length;
  const totalTasks = projects.reduce((sum, p) => sum + p.tasks.length, 0);

  // Tasks by status
  const tasksByStatus = projects.reduce((acc, project) => {
    project.tasks.forEach((task) => {
      acc[task.status] = (acc[task.status] || 0) + 1;
    });
    return acc;
  }, {} as Record<TaskStatus, number>);

  const tasksByStatusData = Object.entries(tasksByStatus).map(([name, value]) => ({
    name,
    value,
  }));

  // Tasks by priority
  const tasksByPriority = projects.reduce((acc, project) => {
    project.tasks.forEach((task) => {
      acc[task.priority] = (acc[task.priority] || 0) + 1;
    });
    return acc;
  }, {} as Record<Priority, number>);

  const tasksByPriorityData = Object.entries(tasksByPriority).map(([name, value]) => ({
    name,
    value,
  }));

  // Projects by status
  const projectsByStatus = projects.reduce((acc, project) => {
    acc[project.status] = (acc[project.status] || 0) + 1;
    return acc;
  }, {} as Record<ProjectStatus, number>);

  const projectsByStatusData = Object.entries(projectsByStatus).map(([name, value]) => ({
    name,
    value,
  }));

  // Upcoming deadlines
  const upcomingDeadlines = projects
    .flatMap((project) => {
      const projectDeadlines = project.deadline
        ? [{ 
            type: "project", 
            id: project.id, 
            title: project.title, 
            deadline: project.deadline instanceof Date ? project.deadline : new Date(project.deadline)
          }]
        : [];
      const taskDeadlines = project.tasks
        .filter((task) => task.deadline)
        .map((task) => ({
          type: "task",
          id: task.id,
          title: task.title,
          deadline: task.deadline instanceof Date ? task.deadline : new Date(task.deadline!),
          projectTitle: project.title,
        }));
      return [...projectDeadlines, ...taskDeadlines];
    })
    .filter((item) => {
      const deadlineDate = item.deadline instanceof Date ? item.deadline : new Date(item.deadline);
      return isAfter(deadlineDate, startOfToday());
    })
    .sort((a, b) => {
      const dateA = a.deadline instanceof Date ? a.deadline : new Date(a.deadline);
      const dateB = b.deadline instanceof Date ? b.deadline : new Date(b.deadline);
      return dateA.getTime() - dateB.getTime();
    })
    .slice(0, 5);

  // Overdue items
  const overdueItems = projects
    .flatMap((project) => {
      const projectDeadline = project.deadline 
        ? (project.deadline instanceof Date ? project.deadline : new Date(project.deadline))
        : null;
      const projectOverdue = projectDeadline && isPast(projectDeadline)
        ? [{ type: "project", id: project.id, title: project.title, deadline: projectDeadline }]
        : [];
      const taskOverdue = project.tasks
        .filter((task) => {
          if (!task.deadline) return false;
          const taskDeadline = task.deadline instanceof Date ? task.deadline : new Date(task.deadline);
          return isPast(taskDeadline);
        })
        .map((task) => ({
          type: "task",
          id: task.id,
          title: task.title,
          deadline: task.deadline instanceof Date ? task.deadline : new Date(task.deadline!),
          projectTitle: project.title,
        }));
      return [...projectOverdue, ...taskOverdue];
    })
    .sort((a, b) => {
      const dateA = a.deadline instanceof Date ? a.deadline : new Date(a.deadline);
      const dateB = b.deadline instanceof Date ? b.deadline : new Date(b.deadline);
      return dateA.getTime() - dateB.getTime();
    });

  // Follow-up required count
  const followUpRequired = projects.filter(
    (p) => p.followUp || p.tasks.some((t) => t.followUp)
  ).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Analytics Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Insights and statistics about your projects and tasks
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeProjects}</div>
            <p className="text-xs text-muted-foreground">
              of {totalProjects} total projects
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTasks}</div>
            <p className="text-xs text-muted-foreground">
              across all projects
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Follow-up Required</CardTitle>
            <Flag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{followUpRequired}</div>
            <p className="text-xs text-muted-foreground">
              projects need attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Items</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {overdueItems.length}
            </div>
            <p className="text-xs text-muted-foreground">
              require immediate attention
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tasks by Status */}
        <Card>
          <CardHeader>
            <CardTitle>Tasks by Status</CardTitle>
            <CardDescription>Distribution of tasks across statuses</CardDescription>
          </CardHeader>
          <CardContent>
            {tasksByStatusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={tasksByStatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {tasksByStatusData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS.status[entry.name as TaskStatus] || "#8884d8"}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No tasks data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tasks by Priority */}
        <Card>
          <CardHeader>
            <CardTitle>Tasks by Priority</CardTitle>
            <CardDescription>Distribution of tasks by priority level</CardDescription>
          </CardHeader>
          <CardContent>
            {tasksByPriorityData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={tasksByPriorityData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value">
                    {tasksByPriorityData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS.priority[entry.name as Priority] || "#8884d8"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No tasks data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Projects by Status */}
        <Card>
          <CardHeader>
            <CardTitle>Projects by Status</CardTitle>
            <CardDescription>Distribution of projects across statuses</CardDescription>
          </CardHeader>
          <CardContent>
            {projectsByStatusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={projectsByStatusData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value">
                    {projectsByStatusData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS.projectStatus[entry.name as ProjectStatus] || "#8884d8"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No projects data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Deadlines */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Deadlines</CardTitle>
            <CardDescription>Next 5 deadlines to watch</CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingDeadlines.length > 0 ? (
              <div className="space-y-3">
                {upcomingDeadlines.map((item) => (
                  <div
                    key={`${item.type}-${item.id}`}
                    className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{item.title}</span>
                        <Badge variant="outline" className="text-xs">
                          {item.type}
                        </Badge>
                      </div>
                      {"projectTitle" in item && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {item.projectTitle}
                        </p>
                      )}
                    </div>
                    <div className="text-sm font-medium">
                      {format(item.deadline instanceof Date ? item.deadline : new Date(item.deadline), "MMM d, yyyy")}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No upcoming deadlines
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Overdue Items */}
      {overdueItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <AlertCircle className="h-5 w-5" />
              Overdue Items
            </CardTitle>
            <CardDescription>Items that require immediate attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {overdueItems.map((item) => (
                <div
                  key={`${item.type}-${item.id}`}
                  className="flex items-center justify-between p-3 rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/20"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                      <span className="font-medium">{item.title}</span>
                      <Badge variant="destructive" className="text-xs">
                        {item.type}
                      </Badge>
                    </div>
                    {"projectTitle" in item && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {item.projectTitle}
                      </p>
                    )}
                  </div>
                  <div className="text-sm font-medium text-red-600 dark:text-red-400">
                    {format(item.deadline instanceof Date ? item.deadline : new Date(item.deadline), "MMM d, yyyy")}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

