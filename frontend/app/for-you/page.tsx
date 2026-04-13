"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Bookmark, Heart, MessageCircle } from "lucide-react";
import { blogAPI, bookmarkAPI, likeAPI } from "@/lib/api";
import type { Post } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { LoaderOne } from "@/components/ui/loader";
import { useSearchParams } from "next/navigation";
import { getExcerptFromHtml } from "@/lib/content-preview";
import { useAuth } from "@/context/auth-context";
import { AvatarGroup } from "@/components/ui/avatar-group";
import { toast } from "sonner";

export default function ForYouPage() {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const loadingLockRef = useRef(false);
  const actionLockRef = useRef<Record<number, { like: boolean; save: boolean }>>({});

  const updatePost = (postId: number, updater: (post: Post) => Post) => {
    setPosts((prev) => prev.map((post) => (post.id === postId ? updater(post) : post)));
  };

  const handleLike = async (e: React.MouseEvent, post: Post) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast.error("Please sign in to like posts");
      return;
    }

    const lock = actionLockRef.current[post.id] || { like: false, save: false };
    if (lock.like) {
      return;
    }

    actionLockRef.current[post.id] = { ...lock, like: true };
    const nextLiked = !post.likedByMe;
    const likesBefore = post.stats?.likes ?? 0;

    updatePost(post.id, (current) => ({
      ...current,
      likedByMe: nextLiked,
      stats: {
        likes: Math.max(0, (current.stats?.likes ?? 0) + (nextLiked ? 1 : -1)),
        comments: current.stats?.comments ?? 0,
        saves: current.stats?.saves ?? 0,
      },
    }));

    try {
      if (nextLiked) {
        await likeAPI.like(post.id);
      } else {
        await likeAPI.unlike(post.id);
      }
    } catch (err: unknown) {
      updatePost(post.id, (current) => ({
        ...current,
        likedByMe: !nextLiked,
        stats: {
          likes: likesBefore,
          comments: current.stats?.comments ?? 0,
          saves: current.stats?.saves ?? 0,
        },
      }));
      toast.error(err instanceof Error ? err.message : "Failed to update like");
    } finally {
      actionLockRef.current[post.id] = {
        ...(actionLockRef.current[post.id] || { like: false, save: false }),
        like: false,
      };
    }
  };

  const handleSave = async (e: React.MouseEvent, post: Post) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast.error("Please sign in to save posts");
      return;
    }

    const lock = actionLockRef.current[post.id] || { like: false, save: false };
    if (lock.save) {
      return;
    }

    actionLockRef.current[post.id] = { ...lock, save: true };
    const nextSaved = !post.savedByMe;
    const savesBefore = post.stats?.saves ?? 0;

    updatePost(post.id, (current) => ({
      ...current,
      savedByMe: nextSaved,
      stats: {
        likes: current.stats?.likes ?? 0,
        comments: current.stats?.comments ?? 0,
        saves: Math.max(0, (current.stats?.saves ?? 0) + (nextSaved ? 1 : -1)),
      },
    }));

    try {
      if (nextSaved) {
        await bookmarkAPI.add(post.id, undefined, "Saved");
      } else {
        await bookmarkAPI.remove(post.id);
      }
    } catch (err: unknown) {
      updatePost(post.id, (current) => ({
        ...current,
        savedByMe: !nextSaved,
        stats: {
          likes: current.stats?.likes ?? 0,
          comments: current.stats?.comments ?? 0,
          saves: savesBefore,
        },
      }));
      toast.error(err instanceof Error ? err.message : "Failed to update save");
    } finally {
      actionLockRef.current[post.id] = {
        ...(actionLockRef.current[post.id] || { like: false, save: false }),
        save: false,
      };
    }
  };

  useEffect(() => {
    setSearchQuery((searchParams.get("q") ?? "").trim());
    setPage(1);
    setPosts([]);
  }, [searchParams]);

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      try {
        const res = await blogAPI.forYou(page, searchQuery);

        setPosts((prev) => {
          if (page === 1) {
            return res.data;
          }

          const seen = new Set(prev.map((post) => post.id));
          const incoming = res.data.filter((post) => !seen.has(post.id));
          return [...prev, ...incoming];
        });

        setHasMore(res.data.length === 10);
      } catch {
        if (page === 1) {
          setPosts([]);
        }
        setHasMore(false);
      } finally {
        loadingLockRef.current = false;
        setLoading(false);
      }
    };

    fetchPosts();
  }, [page, searchQuery]);

  useEffect(() => {
    if (!loadMoreRef.current || !hasMore) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (!first?.isIntersecting || loading || loadingLockRef.current || !hasMore) {
          return;
        }

        loadingLockRef.current = true;
        setPage((prev) => prev + 1);
      },
      {
        rootMargin: "250px 0px",
        threshold: 0.1,
      }
    );

    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [hasMore, loading]);

  return (
    <div className="container mx-auto w-full max-w-6xl px-4 pb-10 pt-2 md:pb-12">
      <div className="mb-7 border-b border-border/70 pb-4">
        <h1 className="font-heading text-4xl text-foreground md:text-5xl">For You</h1>
        <p className="mt-2 text-muted-foreground">Personalized stories selected for you.</p>
      </div>

      {loading && page === 1 ? (
        <div className="space-y-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="grid grid-cols-[1fr_160px] gap-5 border-b border-border/70 pb-5">
              <div className="space-y-3">
                <Skeleton className="h-4 w-44" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-4/5" />
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-40" />
              </div>
              <Skeleton className="h-28 w-full rounded-sm" />
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-lg text-muted-foreground">
            {user
              ? "No posts in your For You feed yet. Like, comment, bookmark, or follow writers to build it."
              : "Sign in and interact with posts to build your personalized For You feed."}
          </p>
        </div>
      ) : (
        <ul className="space-y-6">
          {posts.map((post) => (
            <li key={post.id} className="border-b border-border/70 pb-6">
              {(() => {
                const trustAvatars = (post.user?.trustFollowers || []).map((follower) => ({
                  src:
                    follower.avatar ||
                    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                      follower.name || follower.email || `user-${follower.id}`
                    )}`,
                  alt: follower.name || follower.email,
                  label: follower.name || follower.email,
                }));

                return (
                  <>
              <Link href={`/blog/${post.id}`} className="group grid gap-4 md:grid-cols-[1fr_200px]">
                <div className="min-w-0">
                  <p className="mb-2 text-sm text-muted-foreground">
                    In {post.category} by <span className="text-foreground">{post.user.name}</span>
                  </p>
                  {post.recommendationReasons && post.recommendationReasons.length > 0 && (
                    <div className="mb-3 flex flex-wrap gap-2">
                      {post.recommendationReasons.slice(0, 2).map((reason) => (
                        <span
                          key={`${post.id}-${reason}`}
                          className="inline-flex items-center rounded-full border border-primary/25 bg-primary/10 px-2.5 py-0.5 text-[11px] font-medium text-primary"
                        >
                          {reason}
                        </span>
                      ))}
                    </div>
                  )}
                  <h2 className="line-clamp-2 text-3xl font-bold leading-tight text-foreground transition-colors group-hover:text-primary md:text-4xl">
                    {post.title}
                  </h2>
                  <p className="mt-3 line-clamp-2 text-xl text-muted-foreground">
                    {getExcerptFromHtml(post.content, 170)}
                  </p>
                  <div className="mt-4 text-sm text-muted-foreground">
                    {new Date(post.createdAt).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </div>
                </div>

                <div className="flex items-start justify-end">
                  {post.previewImage ? (
                    <Image
                      src={post.previewImage}
                      alt={post.title}
                      width={200}
                      height={128}
                      sizes="(min-width: 768px) 200px, 100vw"
                      className="h-28 w-full max-w-50 rounded-sm object-cover md:h-32"
                    />
                  ) : (
                    <div className="h-28 w-full max-w-50 rounded-sm bg-muted md:h-32" />
                  )}
                </div>
              </Link>

              <div className="mt-3 flex items-center gap-2">
                {trustAvatars.length > 0 ? (
                  <>
                    <AvatarGroup avatars={trustAvatars} maxVisible={4} size={24} overlap={10} />
                    <span className="text-xs font-medium text-muted-foreground">Trust this author</span>
                  </>
                ) : (
                  <span className="text-xs font-medium text-muted-foreground">Be the first to trust this author</span>
                )}
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-5 text-sm text-muted-foreground">
                <button
                  type="button"
                  onClick={(e) => void handleLike(e, post)}
                  className={`inline-flex items-center gap-1.5 transition-colors ${
                    post.likedByMe ? "text-red-500" : "hover:text-foreground"
                  }`}
                >
                  <Heart className={`h-4 w-4 ${post.likedByMe ? "fill-current" : ""}`} />
                  <span>{post.stats?.likes ?? 0}</span>
                </button>

                <Link
                  href={`/blog/${post.id}#comments`}
                  className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>{post.stats?.comments ?? 0}</span>
                </Link>

                <button
                  type="button"
                  onClick={(e) => void handleSave(e, post)}
                  className={`inline-flex items-center gap-1.5 transition-colors ${
                    post.savedByMe ? "text-amber-600" : "hover:text-foreground"
                  }`}
                >
                  <Bookmark className={`h-4 w-4 ${post.savedByMe ? "fill-current" : ""}`} />
                  <span>{post.stats?.saves ?? 0}</span>
                </button>
              </div>
                  </>
                );
              })()}
            </li>
          ))}
        </ul>
      )}

      {posts.length > 0 && (
        <>
          <div ref={loadMoreRef} className="h-2 w-full" aria-hidden="true" />
          {loading && page > 1 && (
            <div className="mt-5 flex flex-col items-center gap-2 text-sm text-muted-foreground">
              <LoaderOne />
              <p>Loading more posts...</p>
            </div>
          )}
          {!hasMore && !loading && (
            <p className="mt-5 text-center text-sm text-muted-foreground">You are all caught up.</p>
          )}
        </>
      )}
    </div>
  );
}
