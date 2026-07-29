import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: true,
      refetchOnMount: "always",
      retry: 1,
      staleTime: 0, // Always consider data stale to guarantee fresh refetches
      gcTime: 0, // Instantly garbage collect unmounted query caches
    },
  },
});

export const clearAppDataOnAuthChange = () => {
  queryClient.cancelQueries();
  queryClient.removeQueries();
  queryClient.clear();
  queryClient.resetQueries();
};

