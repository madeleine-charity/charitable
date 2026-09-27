import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Heart,
  Users,
  DollarSign,
  Clock,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Plus,
  FileText,
  Target,
  Trash2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { RequireSignIn } from "@/components/auth";
import { useAccount } from "@/lib/account";
import type { Nonprofit, Donation, Post } from "@shared/schema";

export default function NonprofitDashboardPage() {
  return (
    <RequireSignIn title="Sign in to manage your nonprofit.">
      <NonprofitDashboard />
    </RequireSignIn>
  );
}

function NonprofitDashboard() {
  const { toast } = useToast();
  const [postDialogOpen, setPostDialogOpen] = useState(false);
  const [postTitle, setPostTitle] = useState("");
  const [postContent, setPostContent] = useState("");
  const [postImageUrl, setPostImageUrl] = useState("");
  const [postGoalAmount, setPostGoalAmount] = useState("");

  const { data: account, isLoading: nonprofitsLoading } = useAccount();
  const nonprofit = account?.nonprofit ?? undefined;

  const { data: donations, isLoading: donationsLoading } = useQuery<Donation[]>({
    queryKey: ["/api/me/donations"],
    enabled: !!nonprofit,
  });

  const { data: posts } = useQuery<Post[]>({
    queryKey: ["/api/nonprofits", nonprofit?.id, "posts"],
    enabled: !!nonprofit?.id,
  });

  const createPostMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", `/api/nonprofits/${nonprofit?.id}/posts`, {
        title: postTitle,
        content: postContent,
        imageUrl: postImageUrl || null,
        goalAmount: postGoalAmount ? parseInt(postGoalAmount) * 100 : null,
      });
    },
    onSuccess: () => {
      toast({ title: "Post created", description: "Your update has been published!" });
      setPostDialogOpen(false);
      setPostTitle("");
      setPostContent("");
      setPostImageUrl("");
      setPostGoalAmount("");
      queryClient.invalidateQueries({ queryKey: ["/api/nonprofits", nonprofit?.id, "posts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/feed"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create post. Please try again.", variant: "destructive" });
    },
  });

  const deletePostMutation = useMutation({
    mutationFn: async (postId: string) => {
      return apiRequest("DELETE", `/api/posts/${postId}`);
    },
    onSuccess: () => {
      toast({ title: "Post deleted", description: "Your post has been removed." });
      queryClient.invalidateQueries({ queryKey: ["/api/nonprofits", nonprofit?.id, "posts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/feed"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete post.", variant: "destructive" });
    },
  });

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
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

  const isLoading = nonprofitsLoading || donationsLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 py-8">
          <div className="mx-auto max-w-7xl px-4 md:px-6">
            <Skeleton className="h-8 w-48 mb-8" />
            <div className="grid md:grid-cols-4 gap-6 mb-8">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <Skeleton className="h-10 w-24" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!nonprofit) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Heart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">No Nonprofit Found</h1>
            <p className="text-muted-foreground mb-6">
              You haven't registered a nonprofit yet.
            </p>
            <Link href="/nonprofit/onboarding">
              <Button>Register Your Nonprofit</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const completedDonations = donations?.filter((d) => d.status === "completed") || [];
  const pendingDonations = donations?.filter((d) => d.status === "pending") || [];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 py-8">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          {(!nonprofit.isVerified || !nonprofit.isActive) && (
            <div className="mb-6 rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-100" data-testid="text-pending-approval">
              {nonprofit.isActive
                ? "Your nonprofit is pending review. It will appear in the feed and Discover once our team approves it."
                : "Your nonprofit has been removed from the platform. Contact us if you think this is a mistake."}
            </div>
          )}
          <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold" data-testid="text-dashboard-title">
                Welcome back, {nonprofit.name}
              </h1>
              <p className="text-muted-foreground">
                Here's an overview of your donations and payouts.
              </p>
            </div>
            <Link href={`/nonprofit/${nonprofit.slug}`}>
              <Button variant="outline" className="gap-2">
                View Public Profile
                <ExternalLink className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <DollarSign className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Raised</p>
                    <p className="text-2xl font-bold" data-testid="text-total-raised">
                      {formatCurrency(nonprofit.totalRaised || 0)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Donors</p>
                    <p className="text-2xl font-bold" data-testid="text-donor-count">
                      {nonprofit.donorCount || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <Clock className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Pending</p>
                    <p className="text-2xl font-bold" data-testid="text-pending">
                      {pendingDonations.length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <Heart className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Completed</p>
                    <p className="text-2xl font-bold" data-testid="text-completed">
                      {completedDonations.length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="mb-8">
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <div>
                <CardTitle>Your Posts</CardTitle>
                <CardDescription>
                  Share updates and fundraisers with your supporters.
                </CardDescription>
              </div>
              <Dialog open={postDialogOpen} onOpenChange={setPostDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2" data-testid="button-create-post">
                    <Plus className="h-4 w-4" />
                    New Post
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Create a Post</DialogTitle>
                    <DialogDescription>
                      Share an update or start a fundraiser to engage your supporters.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="post-title">Title</Label>
                      <Input
                        id="post-title"
                        placeholder="e.g., Help us build a new playground"
                        value={postTitle}
                        onChange={(e) => setPostTitle(e.target.value)}
                        data-testid="input-post-title"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="post-content">Description</Label>
                      <Textarea
                        id="post-content"
                        placeholder="Tell your story and explain how donations will help..."
                        value={postContent}
                        onChange={(e) => setPostContent(e.target.value)}
                        rows={4}
                        data-testid="input-post-content"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="post-image">Image URL (optional)</Label>
                      <Input
                        id="post-image"
                        placeholder="https://example.com/image.jpg"
                        value={postImageUrl}
                        onChange={(e) => setPostImageUrl(e.target.value)}
                        data-testid="input-post-image"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="post-goal">Fundraising Goal (optional)</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                        <Input
                          id="post-goal"
                          type="number"
                          placeholder="5000"
                          className="pl-7"
                          value={postGoalAmount}
                          onChange={(e) => setPostGoalAmount(e.target.value)}
                          data-testid="input-post-goal"
                        />
                      </div>
                    </div>
                    <Button
                      className="w-full"
                      onClick={() => createPostMutation.mutate()}
                      disabled={!postTitle || !postContent || createPostMutation.isPending}
                      data-testid="button-submit-post"
                    >
                      {createPostMutation.isPending ? "Publishing..." : "Publish Post"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {!posts || posts.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">
                    No posts yet. Create your first update to engage supporters!
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {posts.map((post) => {
                    const progress = post.goalAmount
                      ? Math.min(((post.raisedAmount || 0) / post.goalAmount) * 100, 100)
                      : 0;
                    return (
                      <div
                        key={post.id}
                        className="flex gap-4 p-4 border rounded-md"
                        data-testid={`post-item-${post.id}`}
                      >
                        {post.imageUrl && (
                          <div className="w-20 h-20 rounded-md overflow-hidden shrink-0">
                            <img
                              src={post.imageUrl}
                              alt={post.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold truncate">{post.title}</h4>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {post.content}
                          </p>
                          {post.goalAmount && post.goalAmount > 0 && (
                            <div className="mt-2 space-y-1">
                              <div className="flex items-center gap-2 text-xs">
                                <Target className="h-3 w-3" />
                                <span>{formatCurrency(post.raisedAmount || 0)} / {formatCurrency(post.goalAmount)}</span>
                              </div>
                              <Progress value={progress} className="h-1" />
                            </div>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Heart className="h-3 w-3" />
                              {post.likeCount || 0}
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {post.donorCount || 0}
                            </span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deletePostMutation.mutate(post.id)}
                          disabled={deletePostMutation.isPending}
                          data-testid={`button-delete-post-${post.id}`}
                        >
                          <Trash2 className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="mb-8">
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <div>
                <CardTitle>Payout Information</CardTitle>
                <CardDescription>
                  How and when you'll receive your funds.
                </CardDescription>
              </div>
              {nonprofit.bankAccountLast4 ? (
                <Badge className="gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Bank Connected
                </Badge>
              ) : (
                <Badge variant="outline" className="gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Setup Required
                </Badge>
              )}
            </CardHeader>
            <CardContent>
              <div className="bg-muted/50 p-4 rounded-md">
                <p className="text-sm">
                  {nonprofit.bankAccountLast4 ? (
                    <>
                      Funds are deposited to your bank account ending in{" "}
                      <strong>****{nonprofit.bankAccountLast4}</strong> within 2-3 business
                      days of each donation.
                    </>
                  ) : (
                    <>
                      Please complete your banking setup to receive payouts. Contact support
                      if you need assistance.
                    </>
                  )}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Donations</CardTitle>
              <CardDescription>
                A list of donations received by your organization.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!donations || donations.length === 0 ? (
                <div className="text-center py-12">
                  <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    No donations yet. Share your profile to start receiving contributions!
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Donor</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Message</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {donations.map((donation) => (
                        <TableRow key={donation.id}>
                          <TableCell className="whitespace-nowrap">
                            {formatDate(donation.createdAt)}
                          </TableCell>
                          <TableCell>
                            {donation.isAnonymous
                              ? "Anonymous"
                              : donation.donorName || donation.donorEmail || "Guest"}
                          </TableCell>
                          <TableCell className="font-medium">
                            {formatCurrency(donation.amount)}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={donation.status === "completed" ? "default" : "secondary"}
                            >
                              {donation.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-xs truncate">
                            {donation.message || "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
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
