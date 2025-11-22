import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/contexts/AppContext";
import { useTodos } from "@/contexts/TodoContext";
import { useDashboardFilters } from "@/hooks/useDashboardFilters";
import { DashboardFilters } from "@/components/dashboard/DashboardFilters";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, CheckSquare } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek, isPast } from "date-fns";
import { cn } from "@/lib/utils";
import { Priority } from "@/types";
import { getColorFromTailwind } from "@/utils/colorUtils";

const priorityColors: Record<Priority, string> = {
  Low: "#10b981",
  Medium: "#f59e0b",
  High: "#ea580c",
  Critical: "#dc2626",
};

// Get current user (in real app, this would come from auth context)
const CURRENT_USER = "Emre Kılınç";

export default function Calendar() {
  const navigate = useNavigate();
  const { projects } = useApp();
  const { todos } = useTodos();
  const {
    filters,
    sortBy,
    filteredAndSortedProjects,
    updateFilter,
    toggleFilter,
    clearFilters,
    setSortBy,
    hasActiveFilters,
  } = useDashboardFilters(projects);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"month" | "week">("month");

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const projectsByDate = useMemo(() => {
    const map = new Map<string, typeof filteredAndSortedProjects>();
    
    filteredAndSortedProjects.forEach((project) => {
      const start = format(project.startDate, "yyyy-MM-dd");
      const end = format(project.endDate, "yyyy-MM-dd");
      
      days.forEach((day) => {
        const dayKey = format(day, "yyyy-MM-dd");
        if (dayKey >= start && dayKey <= end) {
          if (!map.has(dayKey)) {
            map.set(dayKey, []);
          }
          map.get(dayKey)!.push(project);
        }
      });
    });

    return map;
  }, [filteredAndSortedProjects, days]);

  const tasksByDate = useMemo(() => {
    const map = new Map<string, Array<{ task: any; project: any }>>();
    
    filteredAndSortedProjects.forEach((project) => {
      project.tasks.forEach((task) => {
        if (task.deadline) {
          const taskKey = format(task.deadline, "yyyy-MM-dd");
          if (!map.has(taskKey)) {
            map.set(taskKey, []);
          }
          map.get(taskKey)!.push({ task, project });
        }
      });
    });

    return map;
  }, [filteredAndSortedProjects]);

  const todosByDate = useMemo(() => {
    const map = new Map<string, typeof todos>();
    
    todos.forEach((todo) => {
      if (todo.deadline && !todo.completed) {
        // Show todo if:
        // 1. Todo has no mentions (it's a personal todo)
        // 2. Current user is mentioned in the todo
        const shouldShow = !todo.mentions || todo.mentions.length === 0 || todo.mentions.includes(CURRENT_USER);
        
        if (shouldShow) {
          // Show todo from createdAt to deadline
          const startDate = todo.createdAt ? new Date(todo.createdAt) : new Date();
          const endDate = new Date(todo.deadline);
          const start = format(startDate, "yyyy-MM-dd");
          const end = format(endDate, "yyyy-MM-dd");
          
          days.forEach((day) => {
            const dayKey = format(day, "yyyy-MM-dd");
            if (dayKey >= start && dayKey <= end) {
              if (!map.has(dayKey)) {
                map.set(dayKey, []);
              }
              map.get(dayKey)!.push(todo);
            }
          });
        }
      }
    });

    return map;
  }, [todos, days]);

  const handlePreviousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  return (
    <div className="px-4 md:px-6 py-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Calendar Timeline</h1>
          <p className="text-muted-foreground mt-1">
            View projects and tasks on a timeline
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={viewMode} onValueChange={(v) => setViewMode(v as "month" | "week")}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Month</SelectItem>
              <SelectItem value="week">Week</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <DashboardFilters
        filters={filters}
        sortBy={sortBy}
        projects={projects}
        onFilterChange={updateFilter}
        onToggleFilter={toggleFilter}
        onSortChange={setSortBy}
        onClearFilters={clearFilters}
        hasActiveFilters={hasActiveFilters}
      />

      <Card>
        <CardContent className="p-6">
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="icon" onClick={handlePreviousMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h2 className="text-xl font-semibold min-w-[200px] text-center">
                {format(currentDate, "MMMM yyyy")}
              </h2>
              <Button variant="outline" size="icon" onClick={handleNextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <Button variant="outline" onClick={handleToday}>
              Today
            </Button>
          </div>

          {/* Calendar Grid */}
          <div className="space-y-2">
            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-2 mb-2">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-2">
              {days.map((day, idx) => {
                const dayKey = format(day, "yyyy-MM-dd");
                const dayProjects = projectsByDate.get(dayKey) || [];
                const dayTasks = tasksByDate.get(dayKey) || [];
                const dayTodos = todosByDate.get(dayKey) || [];
                const isCurrentMonth = isSameMonth(day, currentDate);
                const isToday = isSameDay(day, new Date());
                const dayEnd = new Date(day);
                dayEnd.setHours(23, 59, 59, 999);
                const isPastDate = isPast(dayEnd) && !isToday;

                return (
                  <div
                    key={dayKey}
                    className={cn(
                      "min-h-[120px] border border-border rounded-lg p-2",
                      !isCurrentMonth && "opacity-40",
                      isToday && "ring-2 ring-primary",
                      isPastDate && "bg-muted/30"
                    )}
                  >
                    <div className={cn(
                      "text-sm font-medium mb-1",
                      isToday && "text-primary font-bold"
                    )}>
                      {format(day, "d")}
                    </div>
                    <div className="space-y-1">
                      {/* Projects */}
                      {dayProjects.slice(0, 2).map((project) => (
                        <div
                          key={project.id}
                          onClick={() => navigate(`/project/${project.id}`)}
                          className="text-xs p-1 rounded cursor-pointer hover:opacity-80 transition-opacity truncate"
                          style={{
                            backgroundColor: priorityColors[project.priority] || "#3b82f6",
                            color: "white",
                          }}
                          title={project.title}
                        >
                          {project.title}
                        </div>
                      ))}
                      {dayProjects.length > 2 && (
                        <div className="text-xs text-muted-foreground">
                          +{dayProjects.length - 2} more
                        </div>
                      )}

                      {/* Tasks */}
                      {dayTasks.slice(0, 2).map(({ task, project }) => {
                        const isOverdue = task.deadline && isPast(task.deadline);
                        return (
                          <div
                            key={task.id}
                            onClick={() => navigate(`/project/${project.id}`)}
                            className={cn(
                              "text-xs p-1 rounded cursor-pointer hover:opacity-80 transition-opacity truncate border-l-2",
                              isOverdue && "bg-red-50 dark:bg-red-950/20 border-red-500"
                            )}
                            style={{
                              borderLeftColor: priorityColors[task.priority] || "#3b82f6",
                            }}
                            title={`${task.title} (${project.title})`}
                          >
                            {task.title}
                          </div>
                        );
                      })}
                      {dayTasks.length > 2 && (
                        <div className="text-xs text-muted-foreground">
                          +{dayTasks.length - 2} tasks
                        </div>
                      )}

                      {/* Todos */}
                      {dayTodos.slice(0, 2).map((todo) => {
                        const isOverdue = todo.deadline && isPast(todo.deadline);
                        return (
                          <div
                            key={todo.id}
                            onClick={() => navigate("/todos")}
                            className={cn(
                              "text-xs p-1 rounded cursor-pointer hover:opacity-80 transition-opacity truncate flex items-center gap-1",
                              isOverdue ? "bg-orange-50 dark:bg-orange-950/20 border-l-2 border-orange-500" : "bg-blue-50 dark:bg-blue-950/20 border-l-2 border-blue-500"
                            )}
                            title={todo.title}
                          >
                            <CheckSquare className="h-3 w-3 flex-shrink-0" />
                            {todo.title}
                          </div>
                        );
                      })}
                      {dayTodos.length > 2 && (
                        <div className="text-xs text-muted-foreground">
                          +{dayTodos.length - 2} todos
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="mt-6 pt-6 border-t flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: priorityColors.Low }} />
              <span>Low Priority</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: priorityColors.Medium }} />
              <span>Medium Priority</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: priorityColors.High }} />
              <span>High Priority</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: priorityColors.Critical }} />
              <span>Critical Priority</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded border-l-2 border-red-500 bg-red-50 dark:bg-red-950/20" />
              <span>Overdue Task</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded border-l-2 border-blue-500 bg-blue-50 dark:bg-blue-950/20" />
              <span>Todo</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded border-l-2 border-orange-500 bg-orange-50 dark:bg-orange-950/20" />
              <span>Overdue Todo</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

