import { useEffect } from "react";
import { useSearch } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { RequireSignIn } from "@/components/auth";

export default function StripeOnboardingRefreshPage() {
  return (
    <RequireSignIn title="Sign in to continue connecting your bank account.">
      <StripeOnboardingRefresh />
    </RequireSignIn>
  );
}

function StripeOnboardingRefresh() {
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const nonprofitId = params.get("id");

  const getNewLink = useMutation({
    mutationFn: async () => {
      if (!nonprofitId) throw new Error("No nonprofit ID");
      const res = await apiRequest("POST", `/api/nonprofits/${nonprofitId}/stripe-onboarding-link`);
      return res.json();
    },
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
  });

  useEffect(() => {
    if (nonprofitId) {
      getNewLink.mutate();
    }
  }, [nonprofitId]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Redirecting to Stripe...</p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
