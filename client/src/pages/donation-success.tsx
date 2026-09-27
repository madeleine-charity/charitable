import { useEffect } from "react";
import { Link, useSearch } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Heart, ArrowRight, Loader2 } from "lucide-react";

export default function DonationSuccess() {
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const sessionId = params.get("session_id");

  const { data, isLoading } = useQuery<{ status: string; paid: boolean }>({
    queryKey: ["/api/donations/verify", sessionId],
    enabled: !!sessionId,
    refetchInterval: (query) => {
      if (query.state.data?.paid) return false;
      return 2000;
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Processing your donation...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 flex items-center justify-center py-12">
        <div className="mx-auto max-w-md px-4 md:px-6 text-center">
          <Card>
            <CardContent className="pt-8 pb-6">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                <CheckCircle className="h-10 w-10 text-primary" />
              </div>

              <h1 className="text-2xl font-bold mb-4">Thank You!</h1>
              <p className="text-muted-foreground mb-6">
                Your donation has been processed successfully. You're making a real difference!
              </p>

              <div className="bg-muted/50 p-4 rounded-md mb-6">
                <div className="flex items-center justify-center gap-2 text-sm">
                  <Heart className="h-4 w-4 text-primary" />
                  <span>A receipt has been sent to your email.</span>
                </div>
              </div>

              <div className="space-y-3">
                <Link href="/browse">
                  <Button className="w-full gap-2">
                    Find More Causes
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/">
                  <Button variant="outline" className="w-full">
                    Return Home
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
