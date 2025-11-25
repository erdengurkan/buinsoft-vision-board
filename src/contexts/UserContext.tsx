import React, { createContext, useContext, ReactNode } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import api from "@/lib/api";

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

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      return api.get<User[]>("/users");
    },
  });

  const addUserMutation = useMutation({
    mutationFn: async (user: Omit<User, "id" | "createdAt"> & { password: string }) => {
      return api.post<User>("/users", user);
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
      return api.patch<User>(`/users/${id}`, updates);
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
      return api.delete(`/users/${id}`);
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

