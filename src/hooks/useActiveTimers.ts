import { useQuery } from '@tanstack/react-query';

const API_URL = import.meta.env.VITE_API_URL || '/api';

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
                ? `${API_URL}/timers/active?projectId=${projectId}`
                : `${API_URL}/timers/active`;

            const res = await fetch(url);
            if (!res.ok) throw new Error('Failed to fetch active timers');
            return res.json();
        },
        refetchInterval: 10000, // Refetch every 10 seconds as backup (SSE is primary)
        staleTime: 5000, // Consider data fresh for 5 seconds
        refetchOnWindowFocus: false, // Don't refetch on window focus
    });
};
