import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,   // 2 min — data is fresh for 2 min
      gcTime: 1000 * 60 * 10,     // 10 min — keep in memory for 10 min
      retry: 1,
      refetchOnWindowFocus: false, // not applicable on mobile
    },
  },
});
