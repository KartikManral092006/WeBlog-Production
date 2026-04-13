"use client";

import Link from "next/link";
import type { Post } from "@/lib/types";
import { Heart } from "lucide-react";
import { CardBody, CardContainer, CardItem } from "@/components/ui/3d-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AvatarGroup } from "@/components/ui/avatar-group";
import { ShareButton } from "@/components/share-button";
import { generateTitlePreviewImage } from "@/lib/preview";
import { getExcerptFromHtml, htmlToPlainText } from "@/lib/content-preview";

interface BlogCardProps {
  post: Post;
}

export function BlogCard({ post }: BlogCardProps) {
  const excerpt = getExcerptFromHtml(post.content, 160);

  const date = new Date(post.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const authorName = post.user?.name || "Anonymous";
  const titleInitial = post.title?.charAt(0)?.toUpperCase() || "B";
  const readMinutes = Math.max(1, Math.ceil(htmlToPlainText(post.content).split(" ").length / 200));
  const likesCount = post.stats?.likes ?? 0;
  const previewSrc = post.previewImage?.trim()
    ? post.previewImage
    : generateTitlePreviewImage(post.title);
  const authorProfileHref = `/profile/${post.user?.id ?? post.userid}`;
  const trustAvatars = (post.user?.trustFollowers || []).map((follower) => ({
    src: follower.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(follower.name || follower.email || `user-${follower.id}`)}`,
    alt: follower.name || follower.email,
    label: follower.name || follower.email,
  }));

  return (
    <CardContainer className="inter-var w-full">
      <CardBody className="group/card relative h-auto w-full rounded-xl border border-black/10 bg-gray-50 p-6 shadow-sm transition-shadow hover:shadow-xl dark:border-white/[0.2] dark:bg-black dark:hover:shadow-emerald-500/[0.1]">
        <CardItem
          translateZ={55}
          className="text-xl font-bold text-neutral-700 dark:text-white line-clamp-2"
        >
          {post.title}
        </CardItem>

        <CardItem
          as="p"
          translateZ={65}
          className="mt-2 line-clamp-3 max-w-sm text-sm text-neutral-500 dark:text-neutral-300"
        >
          {excerpt}
        </CardItem>

        <CardItem translateZ={50} className="mt-4 flex items-center gap-2">
          {trustAvatars.length > 0 ? (
            <>
              <AvatarGroup avatars={trustAvatars} maxVisible={4} size={28} overlap={10} />
              <span className="text-xs font-medium text-neutral-600 dark:text-neutral-300">
                Trust this author
              </span>
            </>
          ) : (
            <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
              Be the first to trust this author
            </span>
          )}
        </CardItem>

        <CardItem translateZ={95} className="mt-4 w-full">
          <Link href={`/blog/${post.id}`} className="block">
            <div className="relative h-60 w-full overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-900">
              <img
                src={previewSrc}
                alt={`${post.title} preview`}
                className="h-full w-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-black/5 to-transparent" />
              <div className="absolute bottom-5 right-5 flex h-12 w-12 items-center justify-center rounded-full border border-white/30 bg-black/45 text-xl font-bold text-white">
                {titleInitial}
              </div>
            </div>
          </Link>
          <Link
            href={authorProfileHref}
            className="absolute left-5 top-5 z-10 flex items-center gap-2 rounded-full bg-black/25 px-2 py-1 text-white transition hover:bg-black/40"
            aria-label={`View ${authorName}'s profile`}
          >
            <Avatar className="h-8 w-8 ring-1 ring-white/35">
              <AvatarImage src={post.user?.avatar || ""} alt={authorName} />
              <AvatarFallback className="text-xs">
                {authorName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="text-xs">
              <p className="font-semibold">{authorName}</p>
              <p>{date}</p>
            </div>
          </Link>
        </CardItem>

        <div className="mt-8 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CardItem
              translateZ={20}
              as={Link}
              href={`/blog/${post.id}`}
              className="rounded-xl px-4 py-2 text-xs font-medium text-neutral-700 transition hover:text-black dark:text-white"
            >
              Read now →
            </CardItem>
            <CardItem translateZ={20} as="div">
              <ShareButton
                postId={post.id}
                title={post.title}
                size="icon"
                variant="ghost"
                showLabel={false}
                className="h-8 w-8 rounded-xl text-neutral-700 hover:bg-black/5 hover:text-black dark:text-white dark:hover:bg-white/10"
              />
            </CardItem>
          </div>
          <div className="flex items-center gap-2">
            <CardItem
              translateZ={20}
              as="span"
              className="inline-flex items-center gap-1 rounded-xl border border-black/10 bg-white px-3 py-2 text-xs font-semibold text-neutral-700 dark:border-white/20 dark:bg-black/40 dark:text-neutral-200"
            >
              <Heart className="h-3.5 w-3.5" />
              {likesCount}
            </CardItem>
            <CardItem
              translateZ={20}
              as="span"
              className="rounded-xl bg-black px-4 py-2 text-xs font-bold text-white dark:bg-white dark:text-black"
            >
              {readMinutes} min read
            </CardItem>
          </div>
        </div>
      </CardBody>
    </CardContainer>
  );
}
