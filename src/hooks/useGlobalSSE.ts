import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';

const API_URL = import.meta.env.VITE_API_URL || '/api';

// Global SSE connection for all pages - listens to all project updates
export const useGlobalSSE = () => {
  const queryClient = useQueryClient();
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    // Create global SSE connection (no projectId filter)
    const url = `${API_URL}/events`;
    console.log('🌐 Global SSE: Connecting to:', url);

    try {
      const eventSource = new EventSource(url);
      eventSourceRef.current = eventSource;

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('🔔 Global SSE Message received:', data);

          if (data.type === 'project_updated') {
            console.log('✅ Project update received, refetching...', data.projectId);
            // Invalidate and refetch projects when update is received
            // Use a delay to avoid race conditions with optimistic updates
            setTimeout(() => {
              queryClient.invalidateQueries({ queryKey: ['projects'] });
              queryClient.refetchQueries({ queryKey: ['projects'] }).then(() => {
                console.log('✅ Projects refetched after SSE update');
              });
            }, 300);
            // Also refetch comments and activity logs for this project
            if (data.projectId) {
              queryClient.invalidateQueries({ queryKey: ['comments', 'project', data.projectId] });
              queryClient.invalidateQueries({ queryKey: ['activity-logs', data.projectId] });
            }
            // Also refetch active timers
            queryClient.invalidateQueries({ queryKey: ['activeTimers'] });
            queryClient.refetchQueries({ queryKey: ['activeTimers'] });
          } else if (data.type === 'todo_updated' || data.type === 'todo_created' || data.type === 'todo_deleted') {
            console.log('✅ Todo event received:', data.type);
            // Refetch todos when any todo event is received
            queryClient.invalidateQueries({ queryKey: ['todos'] });
            queryClient.refetchQueries({ queryKey: ['todos'] });
          } else if (data.type === 'timer_started' || data.type === 'timer_stopped') {
            console.log('✅ Timer event received:', data.type);
            // Refetch active timers when timer starts/stops
            queryClient.invalidateQueries({ queryKey: ['activeTimers'] });
            queryClient.refetchQueries({ queryKey: ['activeTimers'] });
          } else if (data.type === 'connected') {
            console.log('✅ Global SSE connected:', data.clientId);
          }
        } catch (error) {
          console.error('❌ Error parsing SSE message:', error);
        }
      };

      eventSource.onopen = () => {
        console.log('✅ Global SSE connection opened');
      };

      eventSource.onerror = (error) => {
        console.error('❌ Global SSE error:', error, 'ReadyState:', eventSource.readyState);
        // Reconnect after 3 seconds
        setTimeout(() => {
          if (eventSourceRef.current?.readyState === EventSource.CLOSED) {
            console.log('🔄 Reconnecting Global SSE...');
            eventSourceRef.current = new EventSource(url);
          }
        }, 3000);
      };

    } catch (error) {
      console.error('❌ Failed to create Global EventSource:', error);
    }

    return () => {
      if (eventSourceRef.current) {
        console.log('🔌 Closing Global SSE connection');
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [queryClient]);
};

