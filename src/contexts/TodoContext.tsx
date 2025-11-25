import React, { createContext, useContext, ReactNode } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Todo } from "@/types";
import { toast } from "sonner";
import api from "@/lib/api";

interface TodoContextType {
  todos: Todo[];
  addTodo: (todo: Omit<Todo, "id">) => void;
  updateTodo: (id: string, updates: Partial<Todo>) => void;
  deleteTodo: (id: string) => void;
  toggleTodo: (id: string) => void;
  isLoading: boolean;
}

const TodoContext = createContext<TodoContextType | undefined>(undefined);

export const TodoProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();

  const { data: todos = [], isLoading } = useQuery({
    queryKey: ["todos"],
    queryFn: async () => {
      return api.get<Todo[]>("/todos");
    },
  });

  const addTodoMutation = useMutation({
    mutationFn: async (todo: Omit<Todo, "id">) => {
      return api.post<Todo>("/todos", todo);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["todos"] });
      toast.success("Todo added");
    },
  });

  const updateTodoMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Todo> }) => {
      return api.patch<Todo>(`/todos/${id}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["todos"] });
    },
  });

  const deleteTodoMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.delete(`/todos/${id}`);
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

