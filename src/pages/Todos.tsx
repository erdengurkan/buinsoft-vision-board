import { useState, useMemo } from "react";
import { useTodos } from "@/contexts/TodoContext";
import { useAuth } from "@/contexts/AuthContext";
import { useApp } from "@/contexts/AppContext";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, Plus, Trash2, Edit2, Check, X, UserPlus, X as XIcon, ExternalLink, Calendar as CalendarIconLucide } from "lucide-react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { format, isToday, isPast, startOfToday } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { teamMembers } from "@/data/mockData";

export default function Todos() {
  const { todos, addTodo, updateTodo, deleteTodo, toggleTodo } = useTodos();
  const { user } = useAuth();
  const { projects } = useApp();
  const navigate = useNavigate();
  const [newTodoTitle, setNewTodoTitle] = useState("");
  const [newTodoDeadline, setNewTodoDeadline] = useState<Date | undefined>(undefined);
  const [newTodoMentions, setNewTodoMentions] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [editingDeadline, setEditingDeadline] = useState<Date | undefined>(undefined);
  const [editingMentions, setEditingMentions] = useState<string[]>([]);
  const [deadlinePopoverOpen, setDeadlinePopoverOpen] = useState(false);
  const [editingDeadlinePopoverOpen, setEditingDeadlinePopoverOpen] = useState(false);
  const [mentionsPopoverOpen, setMentionsPopoverOpen] = useState(false);
  const [editingMentionsPopoverOpen, setEditingMentionsPopoverOpen] = useState(false);

  const CURRENT_USER = user?.name || "Emre Kılınç";

  // Categorize incomplete todos into Today and Upcoming
  const { todayTodos, upcomingTodos } = useMemo(() => {
    const incomplete = todos.filter((t) => !t.completed);
    
    const today: typeof todos = [];
    const upcoming: typeof todos = [];
    
    incomplete.forEach((todo) => {
      if (todo.deadline) {
        const deadline = new Date(todo.deadline);
        const deadlineDate = new Date(deadline);
        // If deadline is today OR overdue (past), put in Today
        if (isToday(deadlineDate) || isPast(deadlineDate)) {
          today.push(todo);
        } else {
          // Future deadline goes to upcoming
          upcoming.push(todo);
        }
      } else {
        // No deadline goes to upcoming
        upcoming.push(todo);
      }
    });
    
    // Sort by order
    const sortByOrder = (a: typeof todos[0], b: typeof todos[0]) => {
      const aOrder = a.order ?? 999;
      const bOrder = b.order ?? 999;
      return aOrder - bOrder;
    };
    
    return {
      todayTodos: today.sort(sortByOrder),
      upcomingTodos: upcoming.sort(sortByOrder),
    };
  }, [todos]);

  const completedTodos = todos.filter((t) => t.completed).sort((a, b) => {
    const aOrder = a.order ?? 999;
    const bOrder = b.order ?? 999;
    return aOrder - bOrder;
  });

  // Check if deadline is overdue (past today, not including today)
  const isOverdue = (deadline: Date | undefined) => {
    if (!deadline) return false;
    const deadlineDate = new Date(deadline);
    return isPast(deadlineDate) && !isToday(deadlineDate);
  };

  const handleTodoClick = (todo: typeof todos[0], e?: React.MouseEvent) => {
    // Don't navigate if clicking on checkbox or edit/delete buttons
    if (e) {
      e.stopPropagation();
      const target = e.target as HTMLElement;
      if (target.closest('button') || target.closest('input[type="checkbox"]') || target.closest('.edit-delete-buttons')) {
        return;
      }
    }
    
    if (todo.taskId) {
      // Find the project that contains this task
      for (const project of projects) {
        const task = (project.tasks || []).find((t) => t.id === todo.taskId);
        if (task) {
          navigate(`/project/${project.id}?taskId=${todo.taskId}`);
          return;
        }
      }
      // If task not found in current projects, try to fetch from API silently
      const API_URL = import.meta.env.VITE_API_URL || "/api";
      fetch(`${API_URL}/tasks/${todo.taskId}`)
        .then((taskRes) => {
          if (taskRes.ok) {
            return taskRes.json();
          }
          return null;
        })
        .then((taskData) => {
          if (taskData?.project?.id) {
            navigate(`/project/${taskData.project.id}?taskId=${todo.taskId}`);
          } else {
            toast.error("Task not found");
            navigate("/dashboard");
          }
        })
        .catch((error) => {
          console.error("Failed to fetch task from API:", error);
          toast.error("Task not found");
          navigate("/dashboard");
        });
    }
  };

  const handleMoveToToday = (todo: typeof todos[0]) => {
    const today = startOfToday();
    updateTodo(todo.id, { deadline: today });
    toast.success("Todo moved to today");
  };

  const handleAddTodo = () => {
    if (!newTodoTitle.trim()) {
      toast.error("Todo title cannot be empty");
      return;
    }

    addTodo({
      title: newTodoTitle.trim(),
      completed: false,
      createdAt: new Date(),
      deadline: newTodoDeadline,
      mentions: newTodoMentions.length > 0 ? newTodoMentions : undefined,
      order: todayTodos.length + upcomingTodos.length,
    });

    setNewTodoTitle("");
    setNewTodoDeadline(undefined);
    setNewTodoMentions([]);
    toast.success("Todo added");
  };

  const handleStartEdit = (todo: typeof todos[0]) => {
    setEditingId(todo.id);
    setEditingTitle(todo.title);
    setEditingDeadline(todo.deadline);
    setEditingMentions(todo.mentions || []);
  };

  const handleSaveEdit = (id: string) => {
    if (!editingTitle.trim()) {
      toast.error("Todo title cannot be empty");
      return;
    }

    updateTodo(id, {
      title: editingTitle.trim(),
      deadline: editingDeadline,
      mentions: editingMentions.length > 0 ? editingMentions : undefined,
    });

    setEditingId(null);
    setEditingTitle("");
    setEditingDeadline(undefined);
    setEditingMentions([]);
    toast.success("Todo updated");
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingTitle("");
    setEditingDeadline(undefined);
    setEditingMentions([]);
  };

  const toggleMention = (name: string, mentions: string[], setMentions: (m: string[]) => void) => {
    if (mentions.includes(name)) {
      setMentions(mentions.filter((m) => m !== name));
    } else {
      setMentions([...mentions, name]);
    }
  };

  const handleDelete = (id: string) => {
    deleteTodo(id);
    toast.success("Todo deleted");
  };

  return (
    <div className="px-4 md:px-6 py-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Todo List</h1>
          <p className="text-muted-foreground mt-1">
            Manage your personal todos and deadlines
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add New Todo</CardTitle>
          <CardDescription>Create a new todo item with optional deadline</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              value={newTodoTitle}
              onChange={(e) => setNewTodoTitle(e.target.value)}
              placeholder="Enter todo title..."
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleAddTodo();
                }
              }}
              className="flex-1"
            />
            <Popover open={deadlinePopoverOpen} onOpenChange={setDeadlinePopoverOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-[200px] justify-start text-left font-normal", !newTodoDeadline && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {newTodoDeadline ? format(newTodoDeadline, "PPP") : "Set deadline"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={newTodoDeadline}
                  onSelect={(date) => {
                    setNewTodoDeadline(date);
                    setDeadlinePopoverOpen(false);
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <Popover open={mentionsPopoverOpen} onOpenChange={setMentionsPopoverOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-[150px] justify-start text-left font-normal", newTodoMentions.length === 0 && "text-muted-foreground")}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  {newTodoMentions.length > 0 ? `${newTodoMentions.length} mention${newTodoMentions.length > 1 ? "s" : ""}` : "Mention"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-2" align="start">
                <div className="space-y-1">
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Mention users</div>
                  {teamMembers
                    .filter((member) => member.name !== CURRENT_USER)
                    .map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center gap-2 px-2 py-1.5 hover:bg-muted rounded-md cursor-pointer"
                        onClick={() => toggleMention(member.name, newTodoMentions, setNewTodoMentions)}
                      >
                        <Checkbox
                          checked={newTodoMentions.includes(member.name)}
                          onCheckedChange={() => toggleMention(member.name, newTodoMentions, setNewTodoMentions)}
                        />
                        <span className="text-sm">{member.name}</span>
                      </div>
                    ))}
                </div>
              </PopoverContent>
            </Popover>
            <Button onClick={handleAddTodo}>
              <Plus className="h-4 w-4 mr-2" />
              Add
            </Button>
          </div>
          {newTodoMentions.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {newTodoMentions.map((name) => (
                <Badge key={name} variant="secondary" className="text-xs">
                  @{name}
                  <button
                    onClick={() => setNewTodoMentions(newTodoMentions.filter((m) => m !== name))}
                    className="ml-1 hover:text-destructive"
                  >
                    <XIcon className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Todo (Today) */}
      <Card>
        <CardHeader>
          <CardTitle>Todo (Today) ({todayTodos.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {todayTodos.length > 0 ? (
            <div className="space-y-2">
              {todayTodos.map((todo) => {
                const overdue = isOverdue(todo.deadline);
                return (
                <ContextMenu key={todo.id}>
                  <ContextMenuTrigger asChild>
                    <div
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors",
                        todo.taskId ? "cursor-pointer" : "",
                        overdue ? "border-red-500 border-2" : "border-border"
                      )}
                      onClick={(e) => {
                        if (todo.taskId) {
                          handleTodoClick(todo, e);
                        }
                      }}
                    >
                  <Checkbox
                    checked={todo.completed}
                    onCheckedChange={() => toggleTodo(todo.id)}
                  />
                  {editingId === todo.id ? (
                    <div className="flex-1 flex items-center gap-2">
                      <Input
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleSaveEdit(todo.id);
                          } else if (e.key === "Escape") {
                            handleCancelEdit();
                          }
                        }}
                        className="flex-1"
                        autoFocus
                      />
                      <Popover open={editingDeadlinePopoverOpen} onOpenChange={setEditingDeadlinePopoverOpen}>
                        <PopoverTrigger asChild>
                          <Button variant="outline" size="sm" className={cn("w-[120px] justify-start text-left font-normal text-xs", !editingDeadline && "text-muted-foreground")}>
                            <CalendarIcon className="mr-2 h-3 w-3" />
                            {editingDeadline ? format(editingDeadline, "MMM d") : "Deadline"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={editingDeadline}
                            onSelect={(date) => {
                              setEditingDeadline(date);
                              setEditingDeadlinePopoverOpen(false);
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <Popover open={editingMentionsPopoverOpen} onOpenChange={setEditingMentionsPopoverOpen}>
                        <PopoverTrigger asChild>
                          <Button variant="outline" size="sm" className={cn("w-[120px] justify-start text-left font-normal text-xs", editingMentions.length === 0 && "text-muted-foreground")}>
                            <UserPlus className="mr-2 h-3 w-3" />
                            {editingMentions.length > 0 ? `${editingMentions.length}` : "Mention"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-64 p-2" align="start">
                          <div className="space-y-1">
                            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Mention users</div>
                            {teamMembers
                              .filter((member) => member.name !== CURRENT_USER)
                              .map((member) => (
                                <div
                                  key={member.id}
                                  className="flex items-center gap-2 px-2 py-1.5 hover:bg-muted rounded-md cursor-pointer"
                                  onClick={() => toggleMention(member.name, editingMentions, setEditingMentions)}
                                >
                                  <Checkbox
                                    checked={editingMentions.includes(member.name)}
                                    onCheckedChange={() => toggleMention(member.name, editingMentions, setEditingMentions)}
                                  />
                                  <span className="text-sm">{member.name}</span>
                                </div>
                              ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleSaveEdit(todo.id)}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleCancelEdit}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <div className="font-medium">{todo.title}</div>
                          {todo.taskId && (
                            <Badge variant="outline" className="text-xs">
                              <ExternalLink className="h-3 w-3 mr-1" />
                              Task
                            </Badge>
                          )}
                        </div>
                        {todo.mentions && todo.mentions.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {todo.mentions.map((name) => (
                              <Badge key={name} variant="secondary" className="text-xs">
                                @{name}
                              </Badge>
                            ))}
                          </div>
                        )}
                        {todo.deadline && (
                          <div className={cn(
                            "text-xs flex items-center gap-1 mt-1",
                            overdue ? "text-red-500 font-semibold" : "text-muted-foreground"
                          )}>
                            <CalendarIcon className="h-3 w-3" />
                            Deadline: {format(todo.deadline, "MMM d, yyyy")}
                            {overdue && " (Overdue)"}
                          </div>
                        )}
                        {todo.createdAt && (
                          <div className="text-xs text-muted-foreground mt-1">
                            Created: {format(todo.createdAt, "MMM d, yyyy")}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleStartEdit(todo)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(todo.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </>
                  )}
                    </div>
                  </ContextMenuTrigger>
                  <ContextMenuContent>
                    {todo.taskId && (
                      <>
                        <ContextMenuItem onClick={() => handleTodoClick(todo)}>
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Open Task
                        </ContextMenuItem>
                        <ContextMenuSeparator />
                      </>
                    )}
                    <ContextMenuItem onClick={() => handleStartEdit(todo)}>
                      <Edit2 className="mr-2 h-4 w-4" />
                      Edit
                    </ContextMenuItem>
                    <ContextMenuItem onClick={() => handleDelete(todo.id)} className="text-destructive">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </ContextMenuItem>
                  </ContextMenuContent>
                </ContextMenu>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>No todos for today. Add one above!</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Todo (Upcoming) */}
      <Card>
        <CardHeader>
          <CardTitle>Todo (Upcoming) ({upcomingTodos.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingTodos.length > 0 ? (
            <div className="space-y-2">
              {upcomingTodos.map((todo) => {
                const overdue = isOverdue(todo.deadline);
                return (
                <ContextMenu key={todo.id}>
                  <ContextMenuTrigger asChild>
                    <div
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors",
                        todo.taskId ? "cursor-pointer" : "",
                        overdue ? "border-red-500 border-2" : "border-border"
                      )}
                      onClick={(e) => {
                        if (todo.taskId) {
                          handleTodoClick(todo, e);
                        }
                      }}
                    >
                  <Checkbox
                    checked={todo.completed}
                    onCheckedChange={() => toggleTodo(todo.id)}
                  />
                  {editingId === todo.id ? (
                    <div className="flex-1 flex items-center gap-2">
                      <Input
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleSaveEdit(todo.id);
                          } else if (e.key === "Escape") {
                            handleCancelEdit();
                          }
                        }}
                        className="flex-1"
                        autoFocus
                      />
                      <Popover open={editingDeadlinePopoverOpen} onOpenChange={setEditingDeadlinePopoverOpen}>
                        <PopoverTrigger asChild>
                          <Button variant="outline" size="sm" className={cn("w-[120px] justify-start text-left font-normal text-xs", !editingDeadline && "text-muted-foreground")}>
                            <CalendarIcon className="mr-2 h-3 w-3" />
                            {editingDeadline ? format(editingDeadline, "MMM d") : "Deadline"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={editingDeadline}
                            onSelect={(date) => {
                              setEditingDeadline(date);
                              setEditingDeadlinePopoverOpen(false);
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <Popover open={editingMentionsPopoverOpen} onOpenChange={setEditingMentionsPopoverOpen}>
                        <PopoverTrigger asChild>
                          <Button variant="outline" size="sm" className={cn("w-[120px] justify-start text-left font-normal text-xs", editingMentions.length === 0 && "text-muted-foreground")}>
                            <UserPlus className="mr-2 h-3 w-3" />
                            {editingMentions.length > 0 ? `${editingMentions.length}` : "Mention"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-64 p-2" align="start">
                          <div className="space-y-1">
                            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Mention users</div>
                            {teamMembers
                              .filter((member) => member.name !== CURRENT_USER)
                              .map((member) => (
                                <div
                                  key={member.id}
                                  className="flex items-center gap-2 px-2 py-1.5 hover:bg-muted rounded-md cursor-pointer"
                                  onClick={() => toggleMention(member.name, editingMentions, setEditingMentions)}
                                >
                                  <Checkbox
                                    checked={editingMentions.includes(member.name)}
                                    onCheckedChange={() => toggleMention(member.name, editingMentions, setEditingMentions)}
                                  />
                                  <span className="text-sm">{member.name}</span>
                                </div>
                              ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleSaveEdit(todo.id)}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleCancelEdit}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <div className="font-medium">{todo.title}</div>
                          {todo.taskId && (
                            <Badge variant="outline" className="text-xs">
                              <ExternalLink className="h-3 w-3 mr-1" />
                              Task
                            </Badge>
                          )}
                        </div>
                        {todo.mentions && todo.mentions.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {todo.mentions.map((name) => (
                              <Badge key={name} variant="secondary" className="text-xs">
                                @{name}
                              </Badge>
                            ))}
                          </div>
                        )}
                        {todo.deadline && (
                          <div className={cn(
                            "text-xs flex items-center gap-1 mt-1",
                            overdue ? "text-red-500 font-semibold" : "text-muted-foreground"
                          )}>
                            <CalendarIcon className="h-3 w-3" />
                            Deadline: {format(todo.deadline, "MMM d, yyyy")}
                            {overdue && " (Overdue)"}
                          </div>
                        )}
                        {todo.createdAt && (
                          <div className="text-xs text-muted-foreground mt-1">
                            Created: {format(todo.createdAt, "MMM d, yyyy")}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1 edit-delete-buttons">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleStartEdit(todo)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(todo.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </>
                  )}
                    </div>
                  </ContextMenuTrigger>
                  <ContextMenuContent>
                    {todo.taskId && (
                      <>
                        <ContextMenuItem onClick={() => handleTodoClick(todo)}>
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Open Task
                        </ContextMenuItem>
                        <ContextMenuSeparator />
                      </>
                    )}
                    <ContextMenuItem onClick={() => handleMoveToToday(todo)}>
                      <CalendarIconLucide className="mr-2 h-4 w-4" />
                      Move to Today
                    </ContextMenuItem>
                    <ContextMenuItem onClick={() => handleStartEdit(todo)}>
                      <Edit2 className="mr-2 h-4 w-4" />
                      Edit
                    </ContextMenuItem>
                    <ContextMenuItem onClick={() => handleDelete(todo.id)} className="text-destructive">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </ContextMenuItem>
                  </ContextMenuContent>
                </ContextMenu>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>No upcoming todos. Add one above!</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Completed Todos */}
      {completedTodos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Completed Todos ({completedTodos.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {completedTodos.map((todo) => (
                <div
                  key={todo.id}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30 opacity-60"
                >
                  <Checkbox
                    checked={todo.completed}
                    onCheckedChange={() => toggleTodo(todo.id)}
                  />
                  <div className="flex-1">
                    <div className="font-medium line-through">{todo.title}</div>
                    {todo.deadline && (
                      <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <CalendarIcon className="h-3 w-3" />
                        Deadline: {format(todo.deadline, "MMM d, yyyy")}
                      </div>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(todo.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

