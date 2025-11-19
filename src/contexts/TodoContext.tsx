import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Todo } from "@/types";

interface TodoContextType {
  todos: Todo[];
  addTodo: (todo: Omit<Todo, "id">) => void;
  updateTodo: (id: string, updates: Partial<Todo>) => void;
  deleteTodo: (id: string) => void;
  toggleTodo: (id: string) => void;
}

const TodoContext = createContext<TodoContextType | undefined>(undefined);

const STORAGE_KEY = "buinsoft-vision-board-todos";

// Helper function to serialize todos for localStorage
const serializeTodos = (todos: Todo[]): string => {
  return JSON.stringify(todos);
};

// Helper function to deserialize todos from localStorage
const deserializeTodos = (json: string): Todo[] => {
  const parsed = JSON.parse(json);
  return parsed.map((todo: any) => ({
    ...todo,
    createdAt: new Date(todo.createdAt),
    deadline: todo.deadline ? new Date(todo.deadline) : undefined,
  }));
};

// Load todos from localStorage
const loadTodos = (): Todo[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return deserializeTodos(stored);
    }
  } catch (error) {
    console.error("Error loading todos from localStorage:", error);
  }
  return [];
};

export const TodoProvider = ({ children }: { children: ReactNode }) => {
  const [todos, setTodos] = useState<Todo[]>(loadTodos);

  // Save todos to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, serializeTodos(todos));
    } catch (error) {
      console.error("Error saving todos to localStorage:", error);
    }
  }, [todos]);

  const addTodo = (todoData: Omit<Todo, "id">) => {
    const newTodo: Todo = {
      id: `todo-${Date.now()}-${Math.random()}`,
      ...todoData,
    };
    setTodos((prev) => [...prev, newTodo]);
  };

  const updateTodo = (id: string, updates: Partial<Todo>) => {
    setTodos((prev) =>
      prev.map((todo) => (todo.id === id ? { ...todo, ...updates } : todo))
    );
  };

  const deleteTodo = (id: string) => {
    setTodos((prev) => prev.filter((todo) => todo.id !== id));
  };

  const toggleTodo = (id: string) => {
    setTodos((prev) =>
      prev.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  return (
    <TodoContext.Provider
      value={{
        todos,
        addTodo,
        updateTodo,
        deleteTodo,
        toggleTodo,
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

