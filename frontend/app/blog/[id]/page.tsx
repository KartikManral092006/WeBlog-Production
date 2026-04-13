"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { blogAPI, historyAPI } from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import type { Post } from "@/lib/types";
import { LikeButton } from "@/components/like-button";
import { BookmarkButton } from "@/components/bookmark-button";
import { FollowButton } from "@/components/follow-button";
import { ShareButton } from "@/components/share-button";
import { CommentSection } from "@/components/comment-section";
import { AvatarGroup } from "@/components/ui/avatar-group";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Pencil, Trash2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import sanitizeHtml from "sanitize-html";

export default function BlogDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);

  const postId = Number(params.id);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const res = await blogAPI.getById(postId);
        setPost(res.data);
        if (user) {
          await historyAPI.recordRead(postId);
        }
      } catch {
        toast.error("Failed to load post");
      } finally {
        setLoading(false);
      }
    };
    if (postId) fetchPost();
  }, [postId, user]);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this post?")) return;
    try {
      await blogAPI.delete(postId);
      toast.success("Post deleted");
      router.push("/");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to delete post");
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-8 space-y-4">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-40" />
        <Separator />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-16 text-center">
        <h2 className="text-2xl font-bold mb-2">Post not found</h2>
        <p className="text-muted-foreground mb-4">
          The post you&apos;re looking for doesn&apos;t exist.
        </p>
        <Link href="/">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </Link>
      </div>
    );
  }

  const isOwner = user && user.id === post.userid;
  const isRichContent = /<\/?[a-z][\s\S]*>/i.test(post.content);
  const safePostContent = sanitizeHtml(post.content, {
    allowedTags: [
      "p",
      "h2",
      "h3",
      "h4",
      "ul",
      "ol",
      "li",
      "blockquote",
      "code",
      "pre",
      "strong",
      "em",
      "a",
      "br",
    ],
    allowedAttributes: {
      a: ["href", "target", "rel"],
    },
    allowedSchemes: ["http", "https", "mailto"],
  });
  const date = new Date(post.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const trustAvatars = (post.user?.trustFollowers || []).map((follower) => ({
    src: follower.avatar || `https://avatar.vercel.sh/${encodeURIComponent(follower.email)}`,
    label: follower.name,
    alt: follower.name,
  }));

  return (
    <article className="container mx-auto max-w-3xl px-4 py-8">
      <Link href="/">
        <Button variant="ghost" size="sm" className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </Link>

      {/* Header */}
      <header className="mb-8">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href={`/profile/${post.user?.id ?? post.userid}`}
              aria-label={`View ${(post.user?.name || "Anonymous")}'s profile`}
            >
              <Avatar size="sm" className="ring-1 ring-border/60 transition hover:ring-primary/45">
                <AvatarImage src={post.user?.avatar || ""} alt={post.user?.name || "Anonymous"} />
                <AvatarFallback>
                  {post.user?.name?.charAt(0)?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
            </Link>
            <div>
              <Link
                href={`/profile/${post.user?.id ?? post.userid}`}
                className="text-sm font-medium transition-colors hover:text-primary"
              >
                {post.user?.name || "Anonymous"}
              </Link>
              <p className="text-xs text-muted-foreground">{date}</p>
            </div>
          </div>
          <FollowButton targetUserId={post.userid} />
        </div>

        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
          {post.title}
        </h1>

        {post.tags?.length ? (
          <div className="mb-4 flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <Badge key={tag} variant="secondary">#{tag}</Badge>
            ))}
          </div>
        ) : null}

        <div className="flex items-center gap-3">
          <Badge variant="secondary">
            {Math.ceil(post.content.split(/\s+/).length / 200)} min read
          </Badge>
          {post.visibility === "PRIVATE" ? (
            <Badge variant="outline">Private</Badge>
          ) : null}
          <LikeButton postId={post.id} />
          <BookmarkButton postId={post.id} />
          <ShareButton postId={post.id} title={post.title} />
        </div>

        {trustAvatars.length > 0 && (
          <div className="mt-4 flex items-center gap-3">
            <AvatarGroup avatars={trustAvatars} maxVisible={4} size={36} />
            <span className="text-sm font-medium text-muted-foreground">Trust this author</span>
          </div>
        )}
      </header>

      {/* Actions */}
      {isOwner && (
        <div className="flex items-center gap-2 mb-6">
          <Link href={`/blog/${post.id}/edit`}>
            <Button variant="outline" size="sm">
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </Link>
          <Button variant="outline" size="sm" onClick={handleDelete}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      )}

      <Separator className="my-6" />

      {/* Content */}
      <div className="prose prose-neutral dark:prose-invert max-w-none mb-12">
        {isRichContent ? (
          <div dangerouslySetInnerHTML={{ __html: safePostContent }} />
        ) : (
          post.content.split("\n").map((paragraph, i) => (
            <p key={i} className="mb-4 leading-relaxed">
              {paragraph}
            </p>
          ))
        )}
      </div>

      <Separator className="my-8" />

      {/* Comments */}
      <CommentSection postId={post.id} />
    </article>
  );
}
