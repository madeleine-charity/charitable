import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  CheckCircle,
  XCircle,
  Search,
  Shield,
  AlertTriangle,
  Building2,
  Clock,
  ExternalLink,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { adminHeaders, apiRequest, getAdminPassword, queryClient, setAdminPassword } from "@/lib/queryClient";
import type { Nonprofit } from "@shared/schema";

interface EINVerification {
  found: boolean;
  message?: string;
  organization?: {
    name: string;
    ein: string;
    city: string;
    state: string;
    nteeCode: string;
    subsectionCode: string;
    rulingDate: string;
    taxPeriod: string;
    incomeAmount: number;
    revenueAmount: number;
  };
  filings?: Array<{
    tax_prd: string;
    tax_prd_yr: string;
    totrevenue: number;
    totfuncexp: number;
  }>;
}

export default function AdminPage() {
  const [authed, setAuthed] = useState(() => !!getAdminPassword());

  if (!authed) {
    return <AdminLogin onSuccess={() => setAuthed(true)} />;
  }

  return (
    <AdminDashboard
      onUnauthorized={() => {
        setAdminPassword(null);
        queryClient.removeQueries({ queryKey: ["/api/admin/nonprofits"] });
        setAuthed(false);
      }}
    />
  );
}

function AdminLogin({ onSuccess }: { onSuccess: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/nonprofits", {
        headers: { Authorization: `Bearer ${password}` },
      });
      if (res.ok) {
        setAdminPassword(password);
        onSuccess();
      } else if (res.status === 401) {
        setError("Incorrect password.");
      } else {
        setError("Admin access is unavailable right now.");
      }
    } catch {
      setError("Couldn't reach the server. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>Admin sign in</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="flex flex-col gap-4">
              <Input
                type="password"
                placeholder="Admin password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
                data-testid="input-admin-password"
              />
              {error && (
                <p className="text-sm text-destructive" data-testid="text-admin-error">{error}</p>
              )}
              <Button type="submit" disabled={!password || submitting} data-testid="button-admin-login">
                {submitting ? "Checking..." : "Sign in"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}

function AdminDashboard({ onUnauthorized }: { onUnauthorized: () => void }) {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [verifyingEin, setVerifyingEin] = useState<string | null>(null);
  const [einResult, setEinResult] = useState<EINVerification | null>(null);
  const [einDialogOpen, setEinDialogOpen] = useState(false);
  const [selectedNonprofit, setSelectedNonprofit] = useState<Nonprofit | null>(null);

  const { data: nonprofits, isLoading, error } = useQuery<Nonprofit[]>({
    queryKey: ["/api/admin/nonprofits"],
  });

  useEffect(() => {
    if (error?.message.startsWith("401")) onUnauthorized();
  }, [error, onUnauthorized]);

  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("PATCH", `/api/admin/nonprofits/${id}/approve`);
    },
    onSuccess: () => {
      toast({ title: "Nonprofit approved", description: "The nonprofit is now visible on the platform." });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/nonprofits"] });
    },
    onError: (err: Error) => {
      if (err.message.startsWith("401")) return onUnauthorized();
      toast({ title: "Error", description: "Failed to approve nonprofit.", variant: "destructive" });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("PATCH", `/api/admin/nonprofits/${id}/reject`);
    },
    onSuccess: () => {
      toast({ title: "Nonprofit removed", description: "The nonprofit has been removed from the platform." });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/nonprofits"] });
    },
    onError: (err: Error) => {
      if (err.message.startsWith("401")) return onUnauthorized();
      toast({ title: "Error", description: "Failed to remove nonprofit.", variant: "destructive" });
    },
  });

  const verifyEIN = async (nonprofit: Nonprofit) => {
    setSelectedNonprofit(nonprofit);
    setVerifyingEin(nonprofit.id);
    setEinResult(null);
    setEinDialogOpen(true);
    
    try {
      const url = `/api/admin/verify-ein/${nonprofit.taxId}`;
      const response = await fetch(url, { headers: adminHeaders(url) });
      if (response.status === 401) {
        setEinDialogOpen(false);
        return onUnauthorized();
      }
      const data = await response.json();
      setEinResult(data);
    } catch (error) {
      setEinResult({ found: false, message: "Failed to verify EIN" });
    } finally {
      setVerifyingEin(null);
    }
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(cents / 100);
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const pendingNonprofits = nonprofits?.filter(n => n.isActive && !n.isVerified) || [];
  const approvedNonprofits = nonprofits?.filter(n => n.isActive && n.isVerified) || [];
  const rejectedNonprofits = nonprofits?.filter(n => !n.isActive) || [];

  const filterNonprofits = (list: Nonprofit[]) => {
    if (!searchQuery) return list;
    const query = searchQuery.toLowerCase();
    return list.filter(n => 
      n.name.toLowerCase().includes(query) ||
      n.email.toLowerCase().includes(query) ||
      n.taxId?.toLowerCase().includes(query)
    );
  };

  const NonprofitRow = ({ nonprofit }: { nonprofit: Nonprofit }) => (
    <TableRow data-testid={`row-nonprofit-${nonprofit.id}`}>
      <TableCell>
        <div className="flex flex-col gap-1">
          <span className="font-medium" data-testid={`text-name-${nonprofit.id}`}>{nonprofit.name}</span>
          <span className="text-sm text-muted-foreground">{nonprofit.email}</span>
        </div>
      </TableCell>
      <TableCell>
        <Badge variant="secondary">{nonprofit.category}</Badge>
      </TableCell>
      <TableCell className="text-sm" data-testid={`text-ein-${nonprofit.id}`}>
        {nonprofit.taxId || "-"}
      </TableCell>
      <TableCell>
        <div className="flex flex-col gap-1">
          {nonprofit.stripeConnectedAccountId ? (
            <Badge variant="default" className="w-fit gap-1">
              <CheckCircle className="h-3 w-3" /> Connected
            </Badge>
          ) : (
            <Badge variant="outline" className="w-fit gap-1">
              <Clock className="h-3 w-3" /> Pending
            </Badge>
          )}
        </div>
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {formatDate(nonprofit.createdAt)}
      </TableCell>
      <TableCell>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => verifyEIN(nonprofit)}
            disabled={!nonprofit.taxId}
            data-testid={`button-verify-${nonprofit.id}`}
          >
            <Shield className="h-4 w-4 mr-1" />
            Verify EIN
          </Button>
          {!nonprofit.isVerified && nonprofit.isActive && (
            <Button
              size="sm"
              onClick={() => approveMutation.mutate(nonprofit.id)}
              disabled={approveMutation.isPending}
              data-testid={`button-approve-${nonprofit.id}`}
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Approve
            </Button>
          )}
          {nonprofit.isActive && (
            <Button
              size="sm"
              variant="destructive"
              onClick={() => rejectMutation.mutate(nonprofit.id)}
              disabled={rejectMutation.isPending}
              data-testid={`button-remove-${nonprofit.id}`}
            >
              <XCircle className="h-4 w-4 mr-1" />
              Remove
            </Button>
          )}
          {!nonprofit.isActive && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => approveMutation.mutate(nonprofit.id)}
              disabled={approveMutation.isPending}
              data-testid={`button-restore-${nonprofit.id}`}
            >
              Restore
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 container max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold" data-testid="text-page-title">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Review and approve nonprofit organizations
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-pending-count">
                {pendingNonprofits.length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-approved-count">
                {approvedNonprofits.length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Removed</CardTitle>
              <XCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-removed-count">
                {rejectedNonprofits.length}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Nonprofits
              </CardTitle>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, or EIN..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-full sm:w-80"
                  data-testid="input-search"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="pending">
              <TabsList className="mb-4">
                <TabsTrigger value="pending" data-testid="tab-pending">
                  Pending ({pendingNonprofits.length})
                </TabsTrigger>
                <TabsTrigger value="approved" data-testid="tab-approved">
                  Approved ({approvedNonprofits.length})
                </TabsTrigger>
                <TabsTrigger value="removed" data-testid="tab-removed">
                  Removed ({rejectedNonprofits.length})
                </TabsTrigger>
              </TabsList>

              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : (
                <>
                  <TabsContent value="pending">
                    {filterNonprofits(pendingNonprofits).length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No nonprofits pending review</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Organization</TableHead>
                              <TableHead>Category</TableHead>
                              <TableHead>EIN</TableHead>
                              <TableHead>Stripe Status</TableHead>
                              <TableHead>Registered</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filterNonprofits(pendingNonprofits).map((np) => (
                              <NonprofitRow key={np.id} nonprofit={np} />
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="approved">
                    {filterNonprofits(approvedNonprofits).length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No approved nonprofits</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Organization</TableHead>
                              <TableHead>Category</TableHead>
                              <TableHead>EIN</TableHead>
                              <TableHead>Stripe Status</TableHead>
                              <TableHead>Registered</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filterNonprofits(approvedNonprofits).map((np) => (
                              <NonprofitRow key={np.id} nonprofit={np} />
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="removed">
                    {filterNonprofits(rejectedNonprofits).length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <XCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No removed nonprofits</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Organization</TableHead>
                              <TableHead>Category</TableHead>
                              <TableHead>EIN</TableHead>
                              <TableHead>Stripe Status</TableHead>
                              <TableHead>Registered</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filterNonprofits(rejectedNonprofits).map((np) => (
                              <NonprofitRow key={np.id} nonprofit={np} />
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </TabsContent>
                </>
              )}
            </Tabs>
          </CardContent>
        </Card>
      </main>

      <Footer />

      <Dialog open={einDialogOpen} onOpenChange={setEinDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              EIN Verification
            </DialogTitle>
            <DialogDescription>
              Verifying EIN {selectedNonprofit?.taxId} with IRS records
            </DialogDescription>
          </DialogHeader>

          {verifyingEin ? (
            <div className="space-y-4 py-4">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ) : einResult ? (
            <div className="py-4">
              {einResult.found ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-medium">Verified 501(c)(3) Organization</span>
                  </div>

                  <div className="bg-muted rounded-lg p-4 space-y-3">
                    <div className="flex justify-between gap-4">
                      <span className="text-muted-foreground">IRS Registered Name:</span>
                      <span className="font-medium text-right">{einResult.organization?.name}</span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-muted-foreground">Location:</span>
                      <span className="font-medium">{einResult.organization?.city}, {einResult.organization?.state}</span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-muted-foreground">EIN:</span>
                      <span className="font-medium">{einResult.organization?.ein}</span>
                    </div>
                    {einResult.organization?.rulingDate && (
                      <div className="flex justify-between gap-4">
                        <span className="text-muted-foreground">Ruling Date:</span>
                        <span className="font-medium">{einResult.organization?.rulingDate}</span>
                      </div>
                    )}
                    {einResult.organization?.revenueAmount && (
                      <div className="flex justify-between gap-4">
                        <span className="text-muted-foreground">Revenue (Latest Filing):</span>
                        <span className="font-medium">{formatCurrency(einResult.organization.revenueAmount * 100)}</span>
                      </div>
                    )}
                  </div>

                  {selectedNonprofit && einResult.organization && einResult.organization.name.toLowerCase() !== selectedNonprofit.name.toLowerCase() && (
                    <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg text-yellow-700 dark:text-yellow-300">
                      <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium">Name Mismatch</p>
                        <p className="text-sm">
                          The registered name "{einResult.organization.name}" doesn't match "{selectedNonprofit.name}".
                        </p>
                      </div>
                    </div>
                  )}

                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={() => einResult.organization && window.open(`https://projects.propublica.org/nonprofits/organizations/${einResult.organization.ein}`, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Full IRS Filing History
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                    <XCircle className="h-5 w-5" />
                    <span className="font-medium">Not Found in IRS Records</span>
                  </div>
                  <p className="text-muted-foreground">
                    {einResult.message || "This EIN was not found in the IRS database of tax-exempt organizations. This could mean the organization is not registered as a 501(c)(3), or the EIN may be incorrect."}
                  </p>
                </div>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
