import { QueryClient } from '@tanstack/react-query';
import { AUTH_TOKEN_KEY, AUTH_USER_KEY, apiClient } from './axios';
import { disconnectSocket, initSocket } from './socket';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30, // 30 seconds
      retry: (failureCount, error: unknown) => {
        // Do not retry on 401, 403, 404
        const status = (error as { response?: { status?: number } })?.response?.status;
        if (status && [400, 401, 403, 404, 409].includes(status)) {
          return false;
        }
        return failureCount < 2;
      },
      refetchOnWindowFocus: false
    }
  }
});

/**
 * Executes strict session cleanup conforming to architectural governance rules:
 * 1. Removes all private queries from TanStack Query cache.
 * 2. Clears storage and removes Axios auth headers.
 * 3. Removes all socket listeners and reconnects socket fresh.
 * 4. Cancels all in-flight queries.
 */
export function wipeSessionState(qc: QueryClient = queryClient): void {
  // 1. Remove all private queries
  qc.removeQueries({ queryKey: ['private'] });

  // 2. Clear credentials from localStorage and Axios defaults
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(AUTH_TOKEN_KEY);
    window.localStorage.removeItem(AUTH_USER_KEY);
  }
  delete apiClient.defaults.headers.common['Authorization'];

  // 3. Clean up and reconnect socket cleanly
  disconnectSocket();
  initSocket(qc);

  // 4. Cancel active in-flight queries
  qc.cancelQueries();
}
