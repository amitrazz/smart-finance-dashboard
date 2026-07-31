import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      retry: 1,
      staleTime: 60 * 1000, // 1 minute stale time to prevent duplicate refetch waterfalls
      gcTime: 10 * 60 * 1000, // 10 minutes cache garbage collection
    },
  },
});

export const clearAppDataOnAuthChange = () => {
  queryClient.cancelQueries();
  queryClient.removeQueries();
  queryClient.clear();
  queryClient.resetQueries();
};

