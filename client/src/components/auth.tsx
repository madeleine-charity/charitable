import { SignIn, useAuth } from "@clerk/react";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, type ReactNode } from "react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Skeleton } from "@/components/ui/skeleton";
import { setAuthTokenGetter } from "@/lib/queryClient";

// Lets queryClient attach the Clerk session token, and drops cached
// per-user data when the signed-in user changes.
export function AuthTokenBridge() {
  const { getToken, userId } = useAuth();
  const queryClient = useQueryClient();
  const previousUser = useRef(userId);

  setAuthTokenGetter(() => getToken());

  useEffect(() => {
    if (previousUser.current !== userId) {
      previousUser.current = userId;
      queryClient.clear();
    }
  }, [userId, queryClient]);

  return null;
}

// Renders children only for signed-in users; otherwise shows Clerk's sign-in.
export function RequireSignIn({ children, title }: { children: ReactNode; title?: string }) {
  const { isLoaded, isSignedIn } = useAuth();

  if (isSignedIn) return <>{children}</>;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 flex flex-col items-center justify-center gap-6 px-4 py-16">
        {!isLoaded ? (
          <Skeleton className="h-96 w-full max-w-sm" />
        ) : (
          <>
            {title && <p className="text-muted-foreground text-center">{title}</p>}
            <SignIn
              routing="hash"
              forceRedirectUrl={window.location.pathname + window.location.search}
              signUpForceRedirectUrl={window.location.pathname + window.location.search}
            />
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
