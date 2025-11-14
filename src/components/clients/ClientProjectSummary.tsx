import { Project } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip, 
  Legend 
} from "recharts";
import { isPast, isAfter, startOfToday } from "date-fns";
import { format } from "date-fns";
import { AlertCircle, Calendar, CheckCircle2, Clock, Flag } from "lucide-react";
import { cn } from "@/lib/utils";

interface ClientProjectSummaryProps {
  projects: Project[];
  clientName: string;
}

const COLORS = {
  Potential: "#94a3b8",
  Active: "#3b82f6",
  "In Progress": "#8b5cf6",
  Done: "#10b981",
};

export const ClientProjectSummary = ({ projects, clientName }: ClientProjectSummaryProps) => {
  if (projects.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Projects for {clientName}</CardTitle>
          <CardDescription>No projects found for this client</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Calculate statistics
  const totalTasks = projects.reduce((sum, p) => sum + p.tasks.length, 0);
  const completedTasks = projects.reduce(
    (sum, p) => sum + p.tasks.filter((t) => t.status === "Completed").length,
    0
  );
  const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  // Projects by status
  const projectsByStatus = projects.reduce((acc, project) => {
    acc[project.status] = (acc[project.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const statusData = Object.entries(projectsByStatus).map(([name, value]) => ({
    name,
    value,
  }));

  // Upcoming deadlines
  const upcomingDeadlines = projects
    .filter((p) => p.deadline && isAfter(p.deadline, startOfToday()))
    .map((p) => ({
      id: p.id,
      title: p.title,
      deadline: p.deadline!,
      type: "project" as const,
    }))
    .sort((a, b) => a.deadline.getTime() - b.deadline.getTime())
    .slice(0, 5);

  // Overdue projects
  const overdueProjects = projects.filter(
    (p) => p.deadline && isPast(p.deadline)
  );

  // Follow-up required
  const followUpRequired = projects.filter(
    (p) => p.followUp || p.tasks.some((t) => t.followUp)
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Project Overview</CardTitle>
          <CardDescription>
            {projects.length} project{projects.length !== 1 ? "s" : ""} for {clientName}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-2xl font-bold">{projects.length}</div>
              <div className="text-sm text-muted-foreground">Total Projects</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{totalTasks}</div>
              <div className="text-sm text-muted-foreground">Total Tasks</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{completedTasks}</div>
              <div className="text-sm text-muted-foreground">Completed</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{Math.round(completionRate)}%</div>
              <div className="text-sm text-muted-foreground">Completion Rate</div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Overall Progress</span>
              <span className="text-sm text-muted-foreground">
                {completedTasks} / {totalTasks}
              </span>
            </div>
            <Progress value={completionRate} className="h-2" />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Status Distribution</CardTitle>
            <CardDescription>Projects by status</CardDescription>
          </CardHeader>
          <CardContent>
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[entry.name as keyof typeof COLORS] || "#8884d8"}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                No data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Alerts */}
        <Card>
          <CardHeader>
            <CardTitle>Alerts & Deadlines</CardTitle>
            <CardDescription>Items requiring attention</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {overdueProjects.length > 0 && (
              <div className="p-3 rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/20">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                  <span className="font-medium text-red-600 dark:text-red-400">
                    {overdueProjects.length} Overdue Project{overdueProjects.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <ul className="text-sm space-y-1">
                  {overdueProjects.slice(0, 3).map((p) => (
                    <li key={p.id} className="text-muted-foreground">
                      • {p.title}
                      {p.deadline && (
                        <span className="ml-2">
                          ({format(p.deadline, "MMM d, yyyy")})
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {followUpRequired.length > 0 && (
              <div className="p-3 rounded-lg border border-orange-200 dark:border-orange-900 bg-orange-50 dark:bg-orange-950/20">
                <div className="flex items-center gap-2 mb-2">
                  <Flag className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                  <span className="font-medium text-orange-600 dark:text-orange-400">
                    {followUpRequired.length} Follow-up Required
                  </span>
                </div>
                <ul className="text-sm space-y-1">
                  {followUpRequired.slice(0, 3).map((p) => (
                    <li key={p.id} className="text-muted-foreground">
                      • {p.title}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {upcomingDeadlines.length > 0 && (
              <div className="p-3 rounded-lg border border-border bg-muted/30">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Upcoming Deadlines</span>
                </div>
                <ul className="text-sm space-y-1">
                  {upcomingDeadlines.map((item) => (
                    <li key={item.id} className="text-muted-foreground">
                      • {item.title} - {format(item.deadline, "MMM d, yyyy")}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {overdueProjects.length === 0 &&
              followUpRequired.length === 0 &&
              upcomingDeadlines.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No alerts at this time</p>
                </div>
              )}
          </CardContent>
        </Card>
      </div>

      {/* Project List */}
      <Card>
        <CardHeader>
          <CardTitle>All Projects</CardTitle>
          <CardDescription>Complete list of projects for this client</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {projects.map((project) => {
              const taskCompletion =
                project.tasks.length > 0
                  ? (project.tasks.filter((t) => t.status === "Completed").length /
                      project.tasks.length) *
                    100
                  : 0;

              return (
                <div
                  key={project.id}
                  className="p-4 rounded-lg border border-border bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium">{project.title}</h4>
                        <Badge variant="outline">{project.status}</Badge>
                        <Badge
                          className={cn(
                            project.priority === "Critical"
                              ? "bg-red-600"
                              : project.priority === "High"
                              ? "bg-orange-600"
                              : project.priority === "Medium"
                              ? "bg-yellow-600"
                              : "bg-green-600",
                            "text-white text-xs"
                          )}
                        >
                          {project.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {project.description || "No description"}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>{project.tasks.length} tasks</span>
                        {project.deadline && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(project.deadline, "MMM d, yyyy")}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="ml-4 w-24">
                      <div className="text-xs text-muted-foreground mb-1">
                        {Math.round(taskCompletion)}% complete
                      </div>
                      <Progress value={taskCompletion} className="h-2" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

