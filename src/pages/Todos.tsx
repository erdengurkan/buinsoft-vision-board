import { useState } from "react";
import { useTodos } from "@/contexts/TodoContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, Plus, Trash2, Edit2, Check, X, UserPlus, X as XIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { teamMembers } from "@/data/mockData";

// Get current user (in real app, this would come from auth context)
const CURRENT_USER = "Emre Kılınç";

export default function Todos() {
  const { todos, addTodo, updateTodo, deleteTodo, toggleTodo } = useTodos();
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

  const incompleteTodos = todos.filter((t) => !t.completed).sort((a, b) => {
    const aOrder = a.order ?? 999;
    const bOrder = b.order ?? 999;
    return aOrder - bOrder;
  });
  const completedTodos = todos.filter((t) => t.completed).sort((a, b) => {
    const aOrder = a.order ?? 999;
    const bOrder = b.order ?? 999;
    return aOrder - bOrder;
  });

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
      order: incompleteTodos.length,
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
    <div className="space-y-6">
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

      {/* Incomplete Todos */}
      <Card>
        <CardHeader>
          <CardTitle>Active Todos ({incompleteTodos.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {incompleteTodos.length > 0 ? (
            <div className="space-y-2">
              {incompleteTodos.map((todo) => (
                <div
                  key={todo.id}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors"
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
                        <div className="font-medium">{todo.title}</div>
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
                          <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                            <CalendarIcon className="h-3 w-3" />
                            Deadline: {format(todo.deadline, "MMM d, yyyy")}
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
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>No active todos. Add one above!</p>
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

