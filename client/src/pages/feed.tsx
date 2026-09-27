import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Heart, Share2, DollarSign, Users, Target, MoreHorizontal, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { PostWithNonprofit } from "@shared/schema";
import { useState, useEffect } from "react";
import { Header } from "@/components/header";
import { BottomNav } from "@/components/bottom-nav";

function getGuestId(): string {
  let guestId = localStorage.getItem("charitable_guest_id");
  if (!guestId) {
    guestId = crypto.randomUUID();
    localStorage.setItem("charitable_guest_id", guestId);
  }
  return guestId;
}

function formatAmount(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function formatTimeAgo(date: Date | string | null): string {
  if (!date) return "";
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString();
}

function PostCard({ post }: { post: PostWithNonprofit }) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likeCount || 0);
  const guestId = getGuestId();

  const { data: likeStatus } = useQuery<{ liked: boolean }>({
    queryKey: ["/api/posts", post.id, "liked", guestId],
    queryFn: async () => {
      const response = await fetch(`/api/posts/${post.id}/liked?guestId=${guestId}`);
      return response.json();
    },
  });

  useEffect(() => {
    if (likeStatus) {
      setLiked(likeStatus.liked);
    }
  }, [likeStatus]);

  const likeMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", `/api/posts/${post.id}/react`, { guestId });
    },
    onMutate: () => {
      setLiked((prev) => !prev);
      setLikeCount((prev) => (liked ? prev - 1 : prev + 1));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/feed"] });
    },
    onError: () => {
      setLiked((prev) => !prev);
      setLikeCount((prev) => (liked ? prev + 1 : prev - 1));
    },
  });

  const progress = post.goalAmount
    ? Math.min(((post.raisedAmount || 0) / post.goalAmount) * 100, 100)
    : 0;

  return (
    <Card className="overflow-hidden border-0 shadow-none rounded-none border-b" data-testid={`card-post-${post.id}`}>
      <div className="flex items-center gap-3 p-4 pb-2">
        <Link href={`/nonprofit/${post.nonprofit.slug}`}>
          <Avatar className="h-10 w-10 cursor-pointer" data-testid={`avatar-nonprofit-${post.nonprofit.id}`}>
            <AvatarImage src={post.nonprofit.logoUrl || undefined} alt={post.nonprofit.name} />
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {post.nonprofit.name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </Link>
        <div className="flex-1 min-w-0">
          <Link href={`/nonprofit/${post.nonprofit.slug}`}>
            <p className="font-semibold text-sm truncate cursor-pointer" data-testid={`text-nonprofit-name-${post.nonprofit.id}`}>
              {post.nonprofit.name}
            </p>
          </Link>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs px-2 py-0" data-testid={`badge-category-${post.id}`}>
              {post.nonprofit.category}
            </Badge>
            <span className="text-xs text-muted-foreground" data-testid={`text-time-${post.id}`}>
              {formatTimeAgo(post.createdAt)}
            </span>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="shrink-0" data-testid={`button-more-${post.id}`}>
          <MoreHorizontal className="h-5 w-5" />
        </Button>
      </div>

      {post.imageUrl && (
        <div className="aspect-video w-full overflow-hidden bg-muted">
          <img
            src={post.imageUrl}
            alt={post.title}
            className="w-full h-full object-cover"
            data-testid={`img-post-${post.id}`}
          />
        </div>
      )}

      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => likeMutation.mutate()}
            disabled={likeMutation.isPending}
            data-testid={`button-like-${post.id}`}
          >
            <Heart
              className={`h-6 w-6 transition-colors ${
                liked ? "fill-red-500 text-red-500" : "text-muted-foreground"
              }`}
            />
          </Button>
          <Button variant="ghost" size="icon" data-testid={`button-share-${post.id}`}>
            <Share2 className="h-6 w-6 text-muted-foreground" />
          </Button>
          <div className="flex-1" />
          <Link href={`/nonprofit/${post.nonprofit.slug}`}>
            <Button variant="default" className="gap-2" data-testid={`button-donate-${post.id}`}>
              <DollarSign className="h-4 w-4" />
              Donate
            </Button>
          </Link>
        </div>

        <p className="text-sm font-medium" data-testid={`text-likes-${post.id}`}>
          {likeCount.toLocaleString()} {likeCount === 1 ? "like" : "likes"}
        </p>

        <div>
          <h3 className="font-semibold text-base" data-testid={`text-title-${post.id}`}>{post.title}</h3>
          <p className="text-sm text-muted-foreground line-clamp-3 mt-1" data-testid={`text-content-${post.id}`}>
            {post.content}
          </p>
        </div>

        {post.goalAmount && post.goalAmount > 0 && (
          <div className="space-y-2" data-testid={`progress-goal-${post.id}`}>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-muted-foreground" />
                <span className="font-semibold">{formatAmount(post.raisedAmount || 0)}</span>
                <span className="text-muted-foreground">of {formatAmount(post.goalAmount)} goal</span>
              </div>
              <span className="text-muted-foreground">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {(post.donorCount || 0).toLocaleString()} donors
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PostSkeleton() {
  return (
    <Card className="overflow-hidden border-0 shadow-none rounded-none border-b">
      <div className="flex items-center gap-3 p-4 pb-2">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
      <Skeleton className="aspect-video w-full" />
      <div className="p-4 space-y-3">
        <div className="flex gap-3">
          <Skeleton className="h-9 w-9 rounded-md" />
          <Skeleton className="h-9 w-9 rounded-md" />
          <div className="flex-1" />
          <Skeleton className="h-9 w-24 rounded-md" />
        </div>
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-2 w-full rounded-full" />
      </div>
    </Card>
  );
}

export default function Feed() {
  const { data: posts, isLoading, refetch, isRefetching } = useQuery<PostWithNonprofit[]>({
    queryKey: ["/api/feed"],
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-lg mx-auto pb-20">
        <div className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
          <div className="flex items-center justify-between px-4 py-3">
            <h1 className="text-xl font-bold" data-testid="text-feed-title">Feed</h1>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => refetch()}
              disabled={isRefetching}
              data-testid="button-refresh-feed"
            >
              <RefreshCw className={`h-5 w-5 ${isRefetching ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="divide-y">
            <PostSkeleton />
            <PostSkeleton />
            <PostSkeleton />
          </div>
        ) : posts && posts.length > 0 ? (
          <div className="divide-y" data-testid="feed-posts-container">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center" data-testid="feed-empty-state">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Heart className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold mb-2">No posts yet</h2>
            <p className="text-muted-foreground mb-6">
              Be the first to discover amazing nonprofits and their causes!
            </p>
            <Link href="/browse">
              <Button data-testid="button-browse-nonprofits">
                Browse Nonprofits
              </Button>
            </Link>
          </div>
        )}
      </main>
      <BottomNav />
    </div>
  );
}
