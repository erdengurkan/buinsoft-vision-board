import React, { createContext, useContext, ReactNode } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import api from "@/lib/api";

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

export const CustomerProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      return api.get<Customer[]>("/customers");
    },
  });

  const addCustomerMutation = useMutation({
    mutationFn: async (customer: Omit<Customer, "id" | "createdAt" | "updatedAt">) => {
      return api.post<Customer>("/customers", customer);
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
      return api.patch<Customer>(`/customers/${id}`, updates);
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
      return api.delete(`/customers/${id}`);
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

