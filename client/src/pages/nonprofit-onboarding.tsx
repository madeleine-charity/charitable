import { useEffect, useState } from "react";
import { useLocation, useSearch } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight, Loader2, CheckCircle, Building, FileText, CreditCard, ExternalLink, Shield, AlertCircle } from "lucide-react";
import { SiStripe } from "react-icons/si";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { RequireSignIn } from "@/components/auth";
import { useAccount } from "@/lib/account";
import { useToast } from "@/hooks/use-toast";
import { nonprofitCategories } from "@shared/schema";

interface FormData {
  name: string;
  slug: string;
  mission: string;
  description: string;
  category: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  taxId: string;
}

const initialFormData: FormData = {
  name: "",
  slug: "",
  mission: "",
  description: "",
  category: "",
  email: "",
  phone: "",
  website: "",
  address: "",
  city: "",
  state: "",
  zipCode: "",
  taxId: "",
};

const steps = [
  { title: "Organization Info", icon: Building },
  { title: "Tax Details", icon: FileText },
  { title: "Connect Bank", icon: CreditCard },
];

export default function NonprofitOnboardingPage() {
  return (
    <RequireSignIn title="Create an account or sign in to register your nonprofit.">
      <NonprofitOnboarding />
    </RequireSignIn>
  );
}

function NonprofitOnboarding() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [nonprofitId, setNonprofitId] = useState<string | null>(null);
  const { data: account } = useAccount();

  // Each account manages one nonprofit; send existing owners to their dashboard.
  useEffect(() => {
    if (account?.nonprofit && !nonprofitId) {
      setLocation("/nonprofit/dashboard");
    }
  }, [account, nonprofitId, setLocation]);

  const createNonprofit = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/nonprofits", formData);
      return res.json();
    },
    onSuccess: (data) => {
      setNonprofitId(data.id);
      queryClient.invalidateQueries({ queryKey: ["/api/me"] });
      setCurrentStep(2);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const [connectError, setConnectError] = useState<string | null>(null);

  const createStripeAccount = useMutation({
    mutationFn: async () => {
      if (!nonprofitId) throw new Error("No nonprofit ID");
      const res = await apiRequest("POST", `/api/nonprofits/${nonprofitId}/create-stripe-account`);
      if (!res.ok) {
        const data = await res.json();
        if (data.code === "CONNECT_NOT_ENABLED") {
          throw new Error("CONNECT_NOT_ENABLED");
        }
        throw new Error(data.message || "Failed to create Stripe account");
      }
      return res.json();
    },
    onSuccess: async () => {
      setConnectError(null);
      startStripeOnboarding.mutate();
    },
    onError: (error: Error) => {
      if (error.message === "CONNECT_NOT_ENABLED") {
        setConnectError("Stripe Connect needs to be enabled in the Stripe Dashboard before nonprofits can connect their bank accounts.");
      } else {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      }
    },
  });

  const startStripeOnboarding = useMutation({
    mutationFn: async () => {
      if (!nonprofitId) throw new Error("No nonprofit ID");
      const res = await apiRequest("POST", `/api/nonprofits/${nonprofitId}/stripe-onboarding-link`);
      return res.json();
    },
    onSuccess: (data) => {
      if (data.url) {
        // Open in new tab to avoid iframe restrictions (Stripe blocks being loaded in iframes)
        window.open(data.url, '_blank');
        toast({
          title: "Stripe Onboarding Opened",
          description: "Complete the Stripe setup in the new tab, then return here.",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateField = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (field === "name") {
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      setFormData((prev) => ({ ...prev, slug }));
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return formData.name && formData.mission && formData.category && formData.email;
      case 1:
        return formData.taxId;
      case 2:
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep === 0) {
      setCurrentStep(1);
    } else if (currentStep === 1) {
      createNonprofit.mutate();
    }
  };

  const handleBack = () => {
    if (currentStep > 0 && currentStep < 2) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleConnectStripe = () => {
    createStripeAccount.mutate();
  };

  const handleSkipForNow = () => {
    if (nonprofitId) {
      toast({
        title: "Registration Complete",
        description: "You can connect your bank account later from your dashboard.",
      });
      setLocation("/nonprofit/dashboard");
    }
  };

  const progress = ((currentStep + 1) / steps.length) * 100;
  const isConnecting = createStripeAccount.isPending || startStripeOnboarding.isPending;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 py-12">
        <div className="mx-auto max-w-2xl px-4 md:px-6">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Register Your Nonprofit</h1>
            <p className="text-muted-foreground">
              Complete these steps to start receiving digital donations.
            </p>
          </div>

          <div className="mb-8">
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between mt-4">
              {steps.map((step, index) => {
                const Icon = step.icon;
                const isComplete = index < currentStep;
                const isCurrent = index === currentStep;
                return (
                  <div
                    key={step.title}
                    className={`flex items-center gap-2 text-sm ${
                      isCurrent
                        ? "text-primary font-medium"
                        : isComplete
                        ? "text-primary"
                        : "text-muted-foreground"
                    }`}
                  >
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full ${
                        isCurrent
                          ? "bg-primary text-primary-foreground"
                          : isComplete
                          ? "bg-primary/20 text-primary"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {isComplete ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <Icon className="h-4 w-4" />
                      )}
                    </div>
                    <span className="hidden sm:inline">{step.title}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{steps[currentStep].title}</CardTitle>
              <CardDescription>
                {currentStep === 0 && "Tell us about your organization."}
                {currentStep === 1 && "Verify your nonprofit status with your tax ID."}
                {currentStep === 2 && "Securely connect your bank account through Stripe."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {currentStep === 0 && (
                <>
                  <div>
                    <Label htmlFor="name">Organization Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => updateField("name", e.target.value)}
                      placeholder="Your Nonprofit Name"
                      data-testid="input-name"
                    />
                  </div>

                  <div>
                    <Label htmlFor="category">Category *</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => updateField("category", value)}
                    >
                      <SelectTrigger data-testid="select-category">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {nonprofitCategories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="mission">Mission Statement *</Label>
                    <Textarea
                      id="mission"
                      value={formData.mission}
                      onChange={(e) => updateField("mission", e.target.value)}
                      placeholder="Briefly describe your organization's mission..."
                      className="resize-none"
                      rows={3}
                      data-testid="input-mission"
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">About Your Organization</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => updateField("description", e.target.value)}
                      placeholder="Tell donors more about what you do..."
                      className="resize-none"
                      rows={4}
                      data-testid="input-description"
                    />
                  </div>

                  <div>
                    <Label htmlFor="email">Contact Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => updateField("email", e.target.value)}
                      placeholder="contact@yournonprofit.org"
                      data-testid="input-email"
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => updateField("phone", e.target.value)}
                      placeholder="(555) 555-5555"
                      data-testid="input-phone"
                    />
                  </div>

                  <div>
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      type="url"
                      value={formData.website}
                      onChange={(e) => updateField("website", e.target.value)}
                      placeholder="https://yournonprofit.org"
                      data-testid="input-website"
                    />
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={formData.city}
                        onChange={(e) => updateField("city", e.target.value)}
                        placeholder="City"
                        data-testid="input-city"
                      />
                    </div>
                    <div>
                      <Label htmlFor="state">State</Label>
                      <Input
                        id="state"
                        value={formData.state}
                        onChange={(e) => updateField("state", e.target.value)}
                        placeholder="State"
                        data-testid="input-state"
                      />
                    </div>
                  </div>
                </>
              )}

              {currentStep === 1 && (
                <>
                  <div>
                    <Label htmlFor="taxId">EIN (Tax ID) *</Label>
                    <Input
                      id="taxId"
                      value={formData.taxId}
                      onChange={(e) => updateField("taxId", e.target.value)}
                      placeholder="XX-XXXXXXX"
                      data-testid="input-tax-id"
                    />
                    <p className="text-sm text-muted-foreground mt-2">
                      Your Employer Identification Number (EIN) is required for tax-deductible donations.
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="address">Street Address</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => updateField("address", e.target.value)}
                      placeholder="123 Main Street"
                      data-testid="input-address"
                    />
                  </div>

                  <div>
                    <Label htmlFor="zipCode">ZIP Code</Label>
                    <Input
                      id="zipCode"
                      value={formData.zipCode}
                      onChange={(e) => updateField("zipCode", e.target.value)}
                      placeholder="12345"
                      data-testid="input-zip"
                    />
                  </div>
                </>
              )}

              {currentStep === 2 && (
                <div className="text-center py-4">
                  <div className="mb-6">
                    <div className="mx-auto w-16 h-16 bg-[#635BFF]/10 rounded-full flex items-center justify-center mb-4">
                      <SiStripe className="w-8 h-8 text-[#635BFF]" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Connect Your Bank Account</h3>
                    <p className="text-muted-foreground max-w-md mx-auto">
                      We use Stripe to securely handle your banking information. 
                      You&apos;ll be redirected to Stripe to enter your bank details and verify your identity.
                    </p>
                  </div>

                  {connectError && (
                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4 rounded-md mb-6 text-left">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-500 mt-0.5 shrink-0" />
                        <div>
                          <p className="font-medium text-sm text-amber-800 dark:text-amber-200">Setup Required</p>
                          <p className="text-sm text-amber-700 dark:text-amber-300">
                            {connectError}
                          </p>
                          <p className="text-sm text-amber-700 dark:text-amber-300 mt-2">
                            You can skip this step for now and donations will still be collected. Bank connection can be completed later.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {!connectError && (
                    <div className="bg-muted/50 p-4 rounded-md mb-6 text-left">
                      <div className="flex items-start gap-3">
                        <Shield className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                        <div>
                          <p className="font-medium text-sm">Bank-Level Security</p>
                          <p className="text-sm text-muted-foreground">
                            Stripe is trusted by millions of businesses worldwide. Your banking information is encrypted and never stored on our servers.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    {!connectError && (
                      <Button
                        size="lg"
                        onClick={handleConnectStripe}
                        disabled={isConnecting}
                        className="w-full sm:w-auto"
                        data-testid="button-connect-stripe"
                      >
                        {isConnecting ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <ExternalLink className="h-4 w-4 mr-2" />
                        )}
                        Connect with Stripe
                      </Button>
                    )}
                    
                    <div>
                      <Button
                        variant={connectError ? "default" : "ghost"}
                        onClick={handleSkipForNow}
                        className={connectError ? "" : "text-muted-foreground"}
                        data-testid="button-skip-stripe"
                      >
                        {connectError ? "Continue to My Profile" : "Skip for now, I'll do this later"}
                      </Button>
                    </div>
                  </div>

                  {!connectError && (
                    <p className="text-xs text-muted-foreground mt-6">
                      Donations cannot be received until bank connection is complete.
                    </p>
                  )}
                </div>
              )}

              {currentStep < 2 && (
                <div className="flex justify-between pt-4">
                  <Button
                    variant="outline"
                    onClick={handleBack}
                    disabled={currentStep === 0}
                    data-testid="button-back"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                  <Button
                    onClick={handleNext}
                    disabled={!canProceed() || createNonprofit.isPending}
                    data-testid="button-next"
                  >
                    {createNonprofit.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : null}
                    {currentStep === 1 ? "Continue to Bank Setup" : "Next"}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
