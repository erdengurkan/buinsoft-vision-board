import { useQuery, useQueryClient } from "@tanstack/react-query";
import { StatusColumn } from "@/types/workflow";
import api from "@/lib/api";

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
            return api.get(`/workflow?projectId=${projectId}`);
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

        const newStatus = await api.post("/workflow/status", {
            name,
            color,
            type: "task",
            projectId,
            order: finalOrder,
        });

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
        const updated = await api.patch(`/workflow/status/${id}`, updates);

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
        await api.delete(`/workflow/status/${id}`);

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
