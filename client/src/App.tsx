import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/home";
import Browse from "@/pages/browse";
import Feed from "@/pages/feed";
import HowItWorks from "@/pages/how-it-works";
import ForNonprofits from "@/pages/for-nonprofits";
import NonprofitProfile from "@/pages/nonprofit-profile";
import NonprofitOnboarding from "@/pages/nonprofit-onboarding";
import NonprofitDashboard from "@/pages/nonprofit-dashboard";
import DonationSuccess from "@/pages/donation-success";
import StripeOnboardingComplete from "@/pages/stripe-onboarding-complete";
import StripeOnboardingRefresh from "@/pages/stripe-onboarding-refresh";
import Admin from "@/pages/admin";
import { AuthTokenBridge } from "@/components/auth";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/feed" component={Feed} />
      <Route path="/browse" component={Browse} />
      <Route path="/how-it-works" component={HowItWorks} />
      <Route path="/for-nonprofits" component={ForNonprofits} />
      <Route path="/nonprofit/onboarding" component={NonprofitOnboarding} />
      <Route path="/nonprofit/onboarding/complete" component={StripeOnboardingComplete} />
      <Route path="/nonprofit/onboarding/refresh" component={StripeOnboardingRefresh} />
      <Route path="/nonprofit/dashboard" component={NonprofitDashboard} />
      <Route path="/nonprofit/:slug" component={NonprofitProfile} />
      <Route path="/donation/success" component={DonationSuccess} />
      <Route path="/admin" component={Admin} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthTokenBridge />
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
