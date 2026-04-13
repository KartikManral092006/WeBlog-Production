"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ChevronDown,
  Heart,
  Share2,
} from "lucide-react";
import type { Post } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { generateTitlePreviewImage } from "@/lib/preview";
import { likeAPI } from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import { toast } from "sonner";
import { getExcerptFromHtml, htmlToPlainText } from "@/lib/content-preview";

interface ExpandableBlogCardsProps {
  posts: Post[];
}

function HomePostCard({ post }: { post: Post }) {
  const { user } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);

  const authorName = post.user?.name || "Anonymous";
  const authorProfileHref = `/profile/${post.user?.id ?? post.userid}`;
  const previewSrc = post.previewImage?.trim()
    ? post.previewImage
    : generateTitlePreviewImage(post.title);

  const publishDate = new Date(post.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const handleLike = async () => {
    if (!user) {
      toast.error("Please sign in to like posts");
      return;
    }

    setLikeLoading(true);
    try {
      if (liked) {
        await likeAPI.unlike(post.id);
        setLiked(false);
      } else {
        await likeAPI.like(post.id);
        setLiked(true);
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update like");
    } finally {
      setLikeLoading(false);
    }
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/blog/${post.id}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: post.title,
          text: `Check out this blog: ${post.title}`,
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        toast.success("Share link copied to clipboard");
      }
    } catch (err) {
      if (!(err instanceof Error && err.name === "AbortError")) {
        toast.error("Unable to share this blog right now");
      }
    }
  };

  return (
    <Card className="mx-auto h-full w-full max-w-[360px] overflow-hidden border border-border/70 bg-card/90 py-0 shadow-sm">
      <CardHeader className="grid-cols-[auto_1fr] items-center gap-3 px-4 py-3">
        <Link href={authorProfileHref} aria-label={`View ${authorName}'s profile`}>
          <Avatar size="sm" className="ring-1 ring-border/60 transition hover:ring-primary/45">
            <AvatarImage src={post.user?.avatar || ""} alt={authorName} />
            <AvatarFallback>{authorName.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
        </Link>
        <div>
          <CardTitle className="line-clamp-1 text-sm font-semibold">
            <Link href={authorProfileHref} className="transition-colors hover:text-primary">
              {authorName}
            </Link>
          </CardTitle>
          <CardDescription className="text-xs">{publishDate}</CardDescription>
        </div>
      </CardHeader>

      <img
        src={previewSrc}
        alt={post.title}
        className="h-52 w-full object-cover"
        loading="lazy"
      />

      <CardContent className="space-y-3 px-4 py-3">
        <h3 className="line-clamp-1 text-base font-semibold text-foreground">
          {post.title}
        </h3>
        <p className="line-clamp-3 text-sm text-muted-foreground">
          {getExcerptFromHtml(post.content, 120)}
        </p>
      </CardContent>

      <div className="flex items-center gap-1 border-t px-3 py-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={handleLike}
          disabled={likeLoading}
          className={liked ? "text-red-500 hover:text-red-600" : ""}
          aria-label="Like"
        >
          <Heart className={`h-4 w-4 ${liked ? "fill-current" : ""}`} />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={handleShare}
          aria-label="Share"
        >
          <Share2 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => setExpanded((prev) => !prev)}
          aria-expanded={expanded}
          aria-label="Show more"
          className="ml-auto"
        >
          <ChevronDown
            className={`h-4 w-4 transition-transform duration-200 ${expanded ? "rotate-180" : "rotate-0"}`}
          />
        </Button>
      </div>

      {expanded && (
        <CardContent className="border-t bg-muted/35 px-4 py-3">
          <p className="mb-2 text-sm font-semibold text-foreground">Details</p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {htmlToPlainText(post.content)}
          </p>
          <Link href={`/blog/${post.id}`} className="mt-3 inline-block">
            <Button size="sm" variant="secondary" className="rounded-full">
              Read full post
            </Button>
          </Link>
        </CardContent>
      )}
    </Card>
  );
}

export function ExpandableBlogCards({ posts }: ExpandableBlogCardsProps) {
  return (
    <ul className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
      {posts.map((post) => (
        <li key={post.id} className="flex justify-center">
          <HomePostCard post={post} />
        </li>
      ))}
    </ul>
  );
}
