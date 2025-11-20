import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';

const API_URL = import.meta.env.VITE_API_URL || '/api';

// Global SSE connection for all pages - listens to all project updates
export const useGlobalSSE = () => {
  const queryClient = useQueryClient();
  const queryClientRef = useRef(queryClient);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Keep queryClient ref updated
  useEffect(() => {
    queryClientRef.current = queryClient;
  }, [queryClient]);

  useEffect(() => {
    // Don't create multiple connections
    if (eventSourceRef.current) {
      return;
    }

    // Create global SSE connection (no projectId filter)
    const url = `${API_URL}/events`;
    console.log('🌐 Global SSE: Connecting to:', url);

    const connectSSE = () => {
      try {
        const eventSource = new EventSource(url);
        eventSourceRef.current = eventSource;

        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            
            // Only log important messages to reduce console noise
            if (data.type !== 'connected') {
              console.log('🔔 Global SSE Message received:', data.type);
            }

            if (data.type === 'project_updated') {
              // Invalidate queries (will refetch when needed)
              // Use a delay to avoid race conditions with optimistic updates
              setTimeout(() => {
                queryClientRef.current.invalidateQueries({ queryKey: ['projects'] });
                // Also invalidate comments and activity logs for this project
                if (data.projectId) {
                  queryClientRef.current.invalidateQueries({ queryKey: ['comments', 'project', data.projectId] });
                  queryClientRef.current.invalidateQueries({ queryKey: ['activity-logs', data.projectId] });
                }
                // Also invalidate active timers
                queryClientRef.current.invalidateQueries({ queryKey: ['activeTimers'] });
              }, 300);
            } else if (data.type === 'todo_updated' || data.type === 'todo_created' || data.type === 'todo_deleted') {
              // Invalidate todos when any todo event is received (will refetch when needed)
              queryClientRef.current.invalidateQueries({ queryKey: ['todos'] });
            } else if (data.type === 'timer_started' || data.type === 'timer_stopped') {
              // Invalidate active timers when timer starts/stops (will refetch when needed)
              queryClientRef.current.invalidateQueries({ queryKey: ['activeTimers'] });
            }
          } catch (error) {
            console.error('❌ Error parsing SSE message:', error);
          }
        };

        eventSource.onopen = () => {
          console.log('✅ Global SSE connection opened');
          // Clear any pending reconnect
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
          }
        };

        eventSource.onerror = (error) => {
          // Only reconnect if connection is actually closed
          if (eventSource.readyState === EventSource.CLOSED) {
            console.error('❌ Global SSE connection closed, will reconnect...');
            eventSourceRef.current = null;
            
            // Clear any existing reconnect timeout
            if (reconnectTimeoutRef.current) {
              clearTimeout(reconnectTimeoutRef.current);
            }
            
            // Reconnect after 5 seconds (less aggressive)
            reconnectTimeoutRef.current = setTimeout(() => {
              if (!eventSourceRef.current) {
                console.log('🔄 Reconnecting Global SSE...');
                connectSSE();
              }
            }, 5000);
          }
        };

      } catch (error) {
        console.error('❌ Failed to create Global EventSource:', error);
      }
    };

    connectSSE();

    return () => {
      // Clear reconnect timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      
      // Close connection
      if (eventSourceRef.current) {
        console.log('🔌 Closing Global SSE connection');
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, []); // Empty dependency array - only run once
};

