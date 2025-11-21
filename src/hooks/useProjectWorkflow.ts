import { useQuery, useQueryClient } from "@tanstack/react-query";
import { StatusColumn } from "@/types/workflow";

const API_URL = import.meta.env.VITE_API_URL || "/api";

interface UseProjectWorkflowReturn {
    taskStatuses: StatusColumn[];
    isLoading: boolean;
    addTaskStatus: (name: string, color: string, order?: number) => Promise<void>;
    updateTaskStatus: (id: string, updates: Partial<StatusColumn>) => Promise<void>;
    deleteTaskStatus: (id: string) => Promise<void>;
    reorderTaskStatuses: (statusOrders: { id: string; order: number }[]) => Promise<void>;
}

export const useProjectWorkflow = (projectId: string | undefined): UseProjectWorkflowReturn => {
    const queryClient = useQueryClient();

    const { data, isLoading } = useQuery({
        queryKey: ["workflow", projectId],
        queryFn: async () => {
            if (!projectId) return { statuses: [], labels: [] };

            const res = await fetch(`${API_URL}/workflow?projectId=${projectId}`);
            if (!res.ok) throw new Error("Failed to fetch workflow");
            return res.json();
        },
        enabled: !!projectId,
        // Remove staleTime for immediate updates
    });

    const taskStatuses: StatusColumn[] =
        data?.statuses
            ?.filter((s: any) => s.type === "task")
            ?.map((s: any) => ({
                id: s.id,
                name: s.name,
                color: s.color,
                order: s.order,
            })) || [];

    const addTaskStatus = async (name: string, color: string, order?: number) => {
        if (!projectId) throw new Error("No project ID");

        // Calculate order if not provided
        const finalOrder = order !== undefined ? order : (taskStatuses.length > 0 ? Math.max(...taskStatuses.map(s => s.order)) + 1 : 0);

        const res = await fetch(`${API_URL}/workflow/status`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name,
                color,
                type: "task",
                projectId,
                order: finalOrder,
            }),
        });

        if (!res.ok) throw new Error("Failed to add status");

        const newStatus = await res.json();

        // Optimistic update - immediately update cache
        queryClient.setQueryData(["workflow", projectId], (old: any) => {
            if (!old) return old;
            return {
                ...old,
                statuses: [...(old.statuses || []), newStatus],
            };
        });

        // Also refetch to ensure consistency
        await queryClient.invalidateQueries({ queryKey: ["workflow", projectId] });
    };

    const updateTaskStatus = async (id: string, updates: Partial<StatusColumn>) => {
        const res = await fetch(`${API_URL}/workflow/status/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updates),
        });

        if (!res.ok) throw new Error("Failed to update status");

        const updated = await res.json();

        // Optimistic update
        if (projectId) {
            queryClient.setQueryData(["workflow", projectId], (old: any) => {
                if (!old) return old;
                return {
                    ...old,
                    statuses: old.statuses.map((s: any) => s.id === id ? updated : s),
                };
            });

            await queryClient.invalidateQueries({ queryKey: ["workflow", projectId] });
        }
    };

    const deleteTaskStatus = async (id: string) => {
        const res = await fetch(`${API_URL}/workflow/status/${id}`, {
            method: "DELETE",
        });

        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error || "Failed to delete status");
        }

        // Optimistic update
        if (projectId) {
            queryClient.setQueryData(["workflow", projectId], (old: any) => {
                if (!old) return old;
                return {
                    ...old,
                    statuses: old.statuses.filter((s: any) => s.id !== id),
                };
            });

            await queryClient.invalidateQueries({ queryKey: ["workflow", projectId] });
        }
    };

    const reorderTaskStatuses = async (statusOrders: { id: string; order: number }[]) => {
        // Implementation for reordering if needed
        console.log("Reorder not implemented yet", statusOrders);
    };

    return {
        taskStatuses,
        isLoading,
        addTaskStatus,
        updateTaskStatus,
        deleteTaskStatus,
        reorderTaskStatuses,
    };
};
