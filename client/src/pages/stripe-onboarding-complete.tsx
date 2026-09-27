import { useEffect, useState } from "react";
import { useLocation, useSearch } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CheckCircle, AlertCircle, Loader2, ArrowRight, RefreshCw } from "lucide-react";
import type { Nonprofit } from "@shared/schema";
import { RequireSignIn } from "@/components/auth";
import { useAccount } from "@/lib/account";

export default function StripeOnboardingCompletePage() {
  return (
    <RequireSignIn title="Sign in to finish connecting your bank account.">
      <StripeOnboardingComplete />
    </RequireSignIn>
  );
}

function StripeOnboardingComplete() {
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const nonprofitId = params.get("id");

  const { data: status, isLoading, refetch } = useQuery<{
    hasAccount: boolean;
    chargesEnabled: boolean;
    payoutsEnabled: boolean;
    onboardingComplete: boolean;
    requiresAction?: boolean;
  }>({
    queryKey: ["/api/nonprofits", nonprofitId, "stripe-status"],
    enabled: !!nonprofitId,
  });

  const { data: account } = useAccount();
  const nonprofit = account?.nonprofit;

  const isComplete = status?.chargesEnabled && status?.payoutsEnabled;

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Checking your account status...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 py-12">
        <div className="mx-auto max-w-xl px-4 md:px-6">
          <Card>
            <CardHeader className="text-center">
              {isComplete ? (
                <>
                  <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle className="w-8 h-8 text-primary" />
                  </div>
                  <CardTitle className="text-2xl">You&apos;re All Set!</CardTitle>
                  <CardDescription>
                    Your bank account is connected and ready to receive donations.
                  </CardDescription>
                </>
              ) : (
                <>
                  <div className="mx-auto w-16 h-16 bg-amber-100 dark:bg-amber-900/20 rounded-full flex items-center justify-center mb-4">
                    <AlertCircle className="w-8 h-8 text-amber-600 dark:text-amber-500" />
                  </div>
                  <CardTitle className="text-2xl">Almost There</CardTitle>
                  <CardDescription>
                    Stripe needs a bit more information to complete your account setup.
                  </CardDescription>
                </>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-md">
                  {status?.hasAccount ? (
                    <CheckCircle className="h-5 w-5 text-primary shrink-0" />
                  ) : (
                    <div className="h-5 w-5 rounded-full border-2 border-muted-foreground shrink-0" />
                  )}
                  <span className="text-sm">Stripe account created</span>
                </div>

                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-md">
                  {status?.onboardingComplete ? (
                    <CheckCircle className="h-5 w-5 text-primary shrink-0" />
                  ) : (
                    <div className="h-5 w-5 rounded-full border-2 border-muted-foreground shrink-0" />
                  )}
                  <span className="text-sm">Account details submitted</span>
                </div>

                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-md">
                  {status?.chargesEnabled ? (
                    <CheckCircle className="h-5 w-5 text-primary shrink-0" />
                  ) : (
                    <div className="h-5 w-5 rounded-full border-2 border-muted-foreground shrink-0" />
                  )}
                  <span className="text-sm">Ready to receive donations</span>
                </div>

                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-md">
                  {status?.payoutsEnabled ? (
                    <CheckCircle className="h-5 w-5 text-primary shrink-0" />
                  ) : (
                    <div className="h-5 w-5 rounded-full border-2 border-muted-foreground shrink-0" />
                  )}
                  <span className="text-sm">Payouts enabled</span>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                {isComplete ? (
                  <Button
                    onClick={() => setLocation("/nonprofit/dashboard")}
                    data-testid="button-go-dashboard"
                  >
                    Go to Dashboard
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                ) : (
                  <>
                    <Button
                      onClick={() => refetch()}
                      variant="outline"
                      data-testid="button-refresh-status"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh Status
                    </Button>
                    <p className="text-sm text-muted-foreground text-center">
                      Check your email from Stripe for next steps, or wait a few minutes for verification to complete.
                    </p>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
