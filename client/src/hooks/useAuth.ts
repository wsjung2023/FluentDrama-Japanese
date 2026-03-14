import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";

type SafeUser = Omit<User, 'password'>;

export function useAuth() {
  const { data: user, isLoading } = useQuery<SafeUser>({
    queryKey: ["/api/user"],
    retry: false,
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
  };
}