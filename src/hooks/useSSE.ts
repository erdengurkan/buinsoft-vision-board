import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';

const API_URL = import.meta.env.VITE_API_URL || '/api';

export const useSSE = (projectId?: string) => {
  const queryClient = useQueryClient();
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    // Don't connect if no projectId
    if (!projectId) {
      console.warn('⚠️ useSSE: No projectId provided, skipping SSE connection. projectId:', projectId);
      return;
    }

    // Create SSE connection
    const url = `${API_URL}/events?projectId=${projectId}`;
    console.log('🔌 useSSE: Connecting to:', url, 'API_URL:', API_URL);
    
    try {
      const eventSource = new EventSource(url);
      eventSourceRef.current = eventSource;
      console.log('✅ EventSource created, readyState:', eventSource.readyState);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('🔔 SSE Message received:', data);
        
        if (data.type === 'project_updated') {
          console.log('✅ Project update received, refetching...', data.projectId);
          // Invalidate and refetch projects when update is received
          // This will include comments, activity logs, worklogs, etc.
          queryClient.invalidateQueries({ queryKey: ['projects'] });
          queryClient.refetchQueries({ queryKey: ['projects'] });
          // Also refetch active timers
          queryClient.invalidateQueries({ queryKey: ['activeTimers'] });
          queryClient.refetchQueries({ queryKey: ['activeTimers'] });
        } else if (data.type === 'timer_started' || data.type === 'timer_stopped') {
          console.log('✅ Timer event received:', data.type);
          // Refetch active timers when timer starts/stops
          queryClient.invalidateQueries({ queryKey: ['activeTimers'] });
          queryClient.refetchQueries({ queryKey: ['activeTimers'] });
        } else if (data.type === 'connected') {
          console.log('✅ SSE connected:', data.clientId);
        }
      } catch (error) {
        console.error('❌ Error parsing SSE message:', error);
      }
    };

    eventSource.onopen = () => {
      console.log('✅ SSE connection opened for project:', projectId || 'all');
    };

    eventSource.onerror = (error) => {
      console.error('❌ SSE error:', error, 'ReadyState:', eventSource.readyState);
      // Reconnect after 3 seconds
      setTimeout(() => {
        if (eventSourceRef.current?.readyState === EventSource.CLOSED) {
          console.log('🔄 Reconnecting SSE...');
          eventSourceRef.current = new EventSource(url);
        }
      }, 3000);
    };

    } catch (error) {
      console.error('❌ Failed to create EventSource:', error);
    }

    return () => {
      if (eventSourceRef.current) {
        console.log('🔌 Closing SSE connection');
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [projectId, queryClient]);
};

