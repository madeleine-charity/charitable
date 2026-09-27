import { useAuth } from "@clerk/react";
import { useQuery } from "@tanstack/react-query";
import type { Nonprofit } from "@shared/schema";

export type Account = {
  userId: string;
  isAdmin: boolean;
  nonprofit: Nonprofit | null;
};

// The signed-in user's role and the nonprofit they manage. Disabled while signed out.
export function useAccount() {
  const { isSignedIn } = useAuth();
  return useQuery<Account>({
    queryKey: ["/api/me"],
    enabled: !!isSignedIn,
  });
}
