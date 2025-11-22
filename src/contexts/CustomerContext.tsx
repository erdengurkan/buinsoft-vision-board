import React, { createContext, useContext, ReactNode } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useGlobalSSE } from "@/hooks/useGlobalSSE";

interface Customer {
  id: string;
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  createdAt: string;
  updatedAt: string;
}

interface CustomerContextType {
  customers: Customer[];
  addCustomer: (customer: Omit<Customer, "id" | "createdAt" | "updatedAt">) => void;
  updateCustomer: (id: string, updates: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;
  isLoading: boolean;
}

const CustomerContext = createContext<CustomerContextType | undefined>(undefined);

const API_URL = import.meta.env.VITE_API_URL || "/api";

export const CustomerProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();

  // Enable real-time updates via SSE
  useGlobalSSE();

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/customers`);
      if (!res.ok) throw new Error("Failed to fetch customers");
      return res.json();
    },
  });

  const addCustomerMutation = useMutation({
    mutationFn: async (customer: Omit<Customer, "id" | "createdAt" | "updatedAt">) => {
      const res = await fetch(`${API_URL}/customers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(customer),
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({ error: "Failed to create customer" }));
        throw new Error(error.error || "Failed to create customer");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Contact added successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to add contact");
    },
  });

  const updateCustomerMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Customer> }) => {
      const res = await fetch(`${API_URL}/customers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({ error: "Failed to update customer" }));
        throw new Error(error.error || "Failed to update customer");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Contact updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update contact");
    },
  });

  const deleteCustomerMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${API_URL}/customers/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({ error: "Failed to delete customer" }));
        throw new Error(error.error || "Failed to delete customer");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Contact deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete contact");
    },
  });

  const addCustomer = (customer: Omit<Customer, "id" | "createdAt" | "updatedAt">) => {
    addCustomerMutation.mutate(customer);
  };

  const updateCustomer = (id: string, updates: Partial<Customer>) => {
    updateCustomerMutation.mutate({ id, updates });
  };

  const deleteCustomer = (id: string) => {
    if (window.confirm("Are you sure you want to delete this contact?")) {
      deleteCustomerMutation.mutate(id);
    }
  };

  return (
    <CustomerContext.Provider
      value={{
        customers,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        isLoading,
      }}
    >
      {children}
    </CustomerContext.Provider>
  );
};

export const useCustomers = () => {
  const context = useContext(CustomerContext);
  if (!context) {
    throw new Error("useCustomers must be used within CustomerProvider");
  }
  return context;
};

