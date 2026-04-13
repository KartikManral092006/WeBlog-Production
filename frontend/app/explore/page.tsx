"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { blogAPI } from "@/lib/api";
import type { ExploreSort, Post } from "@/lib/types";
import { BlogCard } from "@/components/blog-card";
import { AuthModal } from "@/components/auth-modal";
import { Button } from "@/components/ui/button";
import { HoverBorderGradient } from "@/components/ui/hover-border-gradient";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useAuth } from "@/context/auth-context";

export default function ExplorePage() {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [sort, setSort] = useState<ExploreSort>("latest");
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    const q = (searchParams.get("q") ?? "").trim();
    setSearchQuery(q);
    setPage(1);
  }, [searchParams]);

  useEffect(() => {
    const loadPosts = async () => {
      setLoading(true);
      try {
        const normalizedQuery = searchQuery
          .split(/[\s,]+/)
          .map((term) => term.trim())
          .filter(Boolean)
          .join(" ");

        const res = await blogAPI.explore(page, normalizedQuery, "All", sort);
        setPosts(res.data);
        setHasMore(res.data.length === 10);
      } catch {
        setPosts([]);
        setHasMore(false);
      } finally {
        setLoading(false);
      }
    };

    void loadPosts();
  }, [page, searchQuery, sort]);

  return (
    <div className="container mx-auto px-4 py-8 md:py-10">
      <section className="mb-10 overflow-hidden rounded-3xl border border-border/70 bg-linear-to-br from-muted/50 via-background to-muted/20 p-6 md:p-10">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="font-heading text-4xl leading-tight tracking-tight md:text-6xl">
            Find powerful stories before you write your own.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground md:text-lg">
            Browse what the community is reading. Create an account to unlock writing,
            bookmarks, history, drafts, and scheduling.
          </p>

          {!user && (
            <div className="mt-7 flex items-center justify-center gap-3">
              <HoverBorderGradient
                as="button"
                onClick={() => setAuthOpen(true)}
                containerClassName="rounded-full"
                className="flex items-center rounded-full bg-background px-6 py-2.5 text-base font-medium text-foreground"
              >
                Get Started
              </HoverBorderGradient>
              <Link href="/">
                <HoverBorderGradient
                  as="div"
                  containerClassName="rounded-full"
                  className="flex items-center rounded-full bg-background px-6 py-2.5 text-base font-medium text-foreground"
                >
                  Continue Browsing
                </HoverBorderGradient>
              </Link>
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl">
        <div className="mb-6 flex items-center justify-between gap-3">
          <h2 className="font-heading text-3xl">
            {searchQuery ? `Results for "${searchQuery}"` : "Explore Posts"}
          </h2>
          <div className="flex items-center gap-2">
            <label htmlFor="sort" className="text-sm text-muted-foreground">
              Sort
            </label>
            <select
              id="sort"
              value={sort}
              onChange={(e) => {
                setSort(e.target.value as ExploreSort);
                setPage(1);
              }}
              className="h-9 rounded-md border border-input bg-background px-2.5 text-sm"
            >
              <option value="latest">Latest</option>
              <option value="popular">Popular</option>
              <option value="oldest">Oldest</option>
            </select>
            <Link href="/">
              <Button variant="outline" size="sm">Go to Home</Button>
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-3 rounded-lg border p-6">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground">
            {searchQuery
              ? `No posts found for "${searchQuery}".`
              : "No posts to explore yet."}
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {posts.map((post) => (
              <li key={post.id} className="flex justify-center">
                <BlogCard post={post} />
              </li>
            ))}
          </ul>
        )}

        {!loading && posts.length > 0 && (
          <div className="mt-10 flex items-center justify-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">Page {page}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((prev) => prev + 1)}
              disabled={!hasMore}
            >
              Next
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        )}
      </section>

      <AuthModal open={authOpen} onOpenChange={setAuthOpen} initialTab="register" />
    </div>
  );
}
