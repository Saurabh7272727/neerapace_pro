import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api.js";

export function useSession() {
  return useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      try {
        return await api.get("/auth/me");
      } catch (error) {
        if (error.status === 401) return null;
        throw error;
      }
    },
    retry: false,
  });
}
