import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export interface ActiveTimer {
    id: string;
    taskId: string;
    projectId: string;
    startedAt: string;
    userId: string;
    task?: {
        id: string;
        title: string;
        projectId: string;
    };
}

export const useActiveTimers = (projectId?: string) => {
    return useQuery<ActiveTimer[]>({
        queryKey: ['activeTimers', projectId],
        queryFn: async () => {
            const url = projectId
                ? `/timers/active?projectId=${projectId}`
                : `/timers/active`;
            return api.get<ActiveTimer[]>(url);
        },
        refetchInterval: 10000, // Refetch every 10 seconds as backup (SSE is primary)
        staleTime: 5000, // Consider data fresh for 5 seconds
        refetchOnWindowFocus: false, // Don't refetch on window focus
    });
};
