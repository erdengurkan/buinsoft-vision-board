import React, { createContext, useContext, ReactNode } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useGlobalSSE } from "@/hooks/useGlobalSSE";

interface User {
  id: string;
  email: string;
  name: string | null;
  role: string | null;
  userRole: string | null;
  avatar: string | null;
  createdAt: string;
}

interface UserContextType {
  users: User[];
  addUser: (user: Omit<User, "id" | "createdAt"> & { password: string }) => void;
  updateUser: (id: string, updates: Partial<User & { password?: string }>) => void;
  deleteUser: (id: string) => void;
  isLoading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const API_URL = import.meta.env.VITE_API_URL || "/api";

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();

  // Enable real-time updates via SSE
  useGlobalSSE();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/users`);
      if (!res.ok) throw new Error("Failed to fetch users");
      return res.json();
    },
  });

  const addUserMutation = useMutation({
    mutationFn: async (user: Omit<User, "id" | "createdAt"> & { password: string }) => {
      const res = await fetch(`${API_URL}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(user),
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({ error: "Failed to create user" }));
        throw new Error(error.error || "Failed to create user");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("User added successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to add user");
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<User & { password?: string }> }) => {
      const res = await fetch(`${API_URL}/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({ error: "Failed to update user" }));
        throw new Error(error.error || "Failed to update user");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("User updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update user");
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${API_URL}/users/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({ error: "Failed to delete user" }));
        throw new Error(error.error || "Failed to delete user");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("User deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete user");
    },
  });

  const addUser = (user: Omit<User, "id" | "createdAt"> & { password: string }) => {
    addUserMutation.mutate(user);
  };

  const updateUser = (id: string, updates: Partial<User & { password?: string }>) => {
    updateUserMutation.mutate({ id, updates });
  };

  const deleteUser = (id: string) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      deleteUserMutation.mutate(id);
    }
  };

  return (
    <UserContext.Provider
      value={{
        users,
        addUser,
        updateUser,
        deleteUser,
        isLoading,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUsers = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUsers must be used within UserProvider");
  }
  return context;
};

