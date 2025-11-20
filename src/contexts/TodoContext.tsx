import React, { createContext, useContext, ReactNode } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Todo } from "@/types";
import { toast } from "sonner";
import { useGlobalSSE } from "@/hooks/useGlobalSSE";

interface TodoContextType {
  todos: Todo[];
  addTodo: (todo: Omit<Todo, "id">) => void;
  updateTodo: (id: string, updates: Partial<Todo>) => void;
  deleteTodo: (id: string) => void;
  toggleTodo: (id: string) => void;
  isLoading: boolean;
}

const TodoContext = createContext<TodoContextType | undefined>(undefined);

const API_URL = import.meta.env.VITE_API_URL || "/api";

export const TodoProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();

  // Enable real-time updates via SSE
  useGlobalSSE();

  const { data: todos = [], isLoading } = useQuery({
    queryKey: ["todos"],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/todos`);
      if (!res.ok) throw new Error("Failed to fetch todos");
      return res.json();
    },
  });

  const addTodoMutation = useMutation({
    mutationFn: async (todo: Omit<Todo, "id">) => {
      const res = await fetch(`${API_URL}/todos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(todo),
      });
      if (!res.ok) throw new Error("Failed to create todo");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["todos"] });
      toast.success("Todo added");
    },
  });

  const updateTodoMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Todo> }) => {
      const res = await fetch(`${API_URL}/todos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error("Failed to update todo");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["todos"] });
    },
  });

  const deleteTodoMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${API_URL}/todos/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete todo");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["todos"] });
      toast.success("Todo deleted");
    },
  });

  const addTodo = (todoData: Omit<Todo, "id">) => {
    addTodoMutation.mutate(todoData);
  };

  const updateTodo = (id: string, updates: Partial<Todo>) => {
    updateTodoMutation.mutate({ id, updates });
  };

  const deleteTodo = (id: string) => {
    deleteTodoMutation.mutate(id);
  };

  const toggleTodo = (id: string) => {
    const todo = todos.find((t: Todo) => t.id === id);
    if (todo) {
      updateTodoMutation.mutate({ id, updates: { completed: !todo.completed } });
    }
  };

  return (
    <TodoContext.Provider
      value={{
        todos,
        addTodo,
        updateTodo,
        deleteTodo,
        toggleTodo,
        isLoading,
      }}
    >
      {children}
    </TodoContext.Provider>
  );
};

export const useTodos = () => {
  const context = useContext(TodoContext);
  if (!context) {
    throw new Error("useTodos must be used within TodoProvider");
  }
  return context;
};

