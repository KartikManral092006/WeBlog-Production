"use client";

import { Suspense, useEffect, useState } from "react";
import { blogAPI } from "@/lib/api";
import type { Post } from "@/lib/types";
import { AuthModal } from "@/components/auth-modal";
import { HoverBorderGradient } from "@/components/ui/hover-border-gradient";
import { Marquee } from "@/components/ui/marquee";
import { RetroGrid } from "@/components/ui/retro-grid";
import { LampContainer } from "@/components/ui/lamp";
import { RisingGlow } from "@/components/ui/rising-glow";
import { Mail, Phone, MapPin, Globe, Share2, Rss, AtSign } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/context/auth-context";
import { useRouter, useSearchParams } from "next/navigation";
import { getExcerptFromHtml } from "@/lib/content-preview";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";

function getPostEngagementScore(post: Post) {
  const likes = post.stats?.likes ?? 0;
  const comments = post.stats?.comments ?? 0;
  const saves = post.stats?.saves ?? 0;
  return likes + comments + saves;
}

function ExploreButton({ onClick }: { onClick: () => void }) {
  return (
    <>
      <button type="button" className="explore-btn group" onClick={onClick}>
        Explore
        <svg
          className="explore-btn-icon"
          viewBox="0 0 16 19"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M7 18C7 18.5523 7.44772 19 8 19C8.55228 19 9 18.5523 9 18H7ZM8.70711 0.292893C8.31658 -0.0976311 7.68342 -0.0976311 7.29289 0.292893L0.928932 6.65685C0.538408 7.04738 0.538408 7.68054 0.928932 8.07107C1.31946 8.46159 1.95262 8.46159 2.34315 8.07107L8 2.41421L13.6569 8.07107C14.0474 8.46159 14.6805 8.46159 15.0711 8.07107C15.4616 7.68054 15.4616 7.04738 15.0711 6.65685L8.70711 0.292893ZM9 18L9 1H7L7 18H9Z" />
        </svg>
      </button>

      <style jsx>{`
        .explore-btn {
          position: relative;
          z-index: 10;
          isolation: isolate;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          margin-inline: auto;
          overflow: hidden;
          border: 2px solid color-mix(in oklab, var(--border) 85%, var(--foreground));
          border-radius: 9999px;
          padding: 0.5rem 1rem;
          background: color-mix(in oklab, var(--card) 90%, transparent);
          color: color-mix(in oklab, var(--foreground) 88%, transparent);
          box-shadow:
            0 0 0px 1px color-mix(in oklab, var(--foreground) 18%, transparent),
            0px 1px 1px rgba(3, 7, 18, 0.02),
            0px 5px 4px rgba(3, 7, 18, 0.04),
            0px 12px 9px rgba(3, 7, 18, 0.06),
            0px 20px 15px rgba(3, 7, 18, 0.08),
            0px 32px 24px rgba(3, 7, 18, 0.1);
          backdrop-filter: blur(8px);
          font-size: 1.125rem;
          font-weight: 600;
        }

        .explore-btn::before {
          content: "";
          position: absolute;
          left: -100%;
          z-index: -1;
          aspect-ratio: 1;
          width: 100%;
          border-radius: 9999px;
          background: var(--primary);
          transition: all 700ms;
        }

        .explore-btn:hover {
          color: var(--primary-foreground);
        }

        .explore-btn:hover::before {
          left: 0;
          width: 100%;
          transform: scale(1.5);
        }

        .explore-btn-icon {
          width: 2rem;
          height: 2rem;
          justify-content: flex-end;
          border-radius: 9999px;
          border: 1px solid color-mix(in oklab, var(--foreground) 45%, transparent);
          padding: 0.5rem;
          transform: rotate(45deg);
          color: color-mix(in oklab, var(--foreground) 55%, transparent);
          transition: all 300ms linear;
        }

        .explore-btn-icon path {
          fill: color-mix(in oklab, var(--foreground) 70%, transparent);
        }

        .explore-btn:hover .explore-btn-icon {
          transform: rotate(90deg);
          border: none;
          background: color-mix(in oklab, var(--card) 95%, transparent);
          color: color-mix(in oklab, var(--foreground) 75%, transparent);
        }

        .explore-btn:hover .explore-btn-icon path {
          fill: color-mix(in oklab, var(--foreground) 80%, transparent);
        }
      `}</style>
    </>
  );
}

function FeaturedReviewCard({
  img,
  name,
  username,
  body,
  href,
}: {
  img: string;
  name: string;
  username: string;
  body: string;
  href: string;
}) {
  return (
    <Link href={href}>
      <figure
        className={cn(
          "relative h-full w-64 cursor-pointer overflow-hidden rounded-xl border p-4",
          "border-gray-950/10 bg-gray-950/1 hover:bg-gray-950/5",
          "dark:border-gray-50/10 dark:bg-gray-50/10 dark:hover:bg-gray-50/15"
        )}
      >
        <div className="flex flex-row items-center gap-2">
          <Image
            className="rounded-full object-cover"
            width={32}
            height={32}
            sizes="32px"
            alt={name}
            src={img}
          />
          <div className="flex flex-col">
            <figcaption className="text-sm font-medium dark:text-white">{name}</figcaption>
            <p className="text-xs font-medium dark:text-white/40">{username}</p>
          </div>
        </div>
        <blockquote className="mt-2 line-clamp-3 text-sm">{body}</blockquote>
      </figure>
    </Link>
  );
}

function HomePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [authOpen, setAuthOpen] = useState(false);

  useEffect(() => {
    setSearchQuery((searchParams.get("q") ?? "").trim());
  }, [searchParams]);

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      try {
        const res = await blogAPI.explore(1, searchQuery, "All");
        setPosts(res.data);
      } catch {
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, [searchQuery]);

  const featured = [...posts]
    .sort((a, b) => {
      const scoreDiff = getPostEngagementScore(b) - getPostEngagementScore(a);
      if (scoreDiff !== 0) {
        return scoreDiff;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    })
    .slice(0, 6);
  const reviews = featured.map((post) => ({
    id: post.id,
    name: post.user.name,
    username: `@${post.user.email.split("@")[0]}`,
    body: `${post.title} - ${getExcerptFromHtml(post.content, 95)}`,
    img: post.user.avatar || `https://avatar.vercel.sh/${encodeURIComponent(post.user.email)}`,
    href: `/blog/${post.id}`,
  }));

  const marqueeSeed =
    reviews.length >= 6
      ? reviews
      : Array.from({ length: Math.max(6, reviews.length * 2) }, (_, i) => reviews[i % reviews.length]);
  const firstRow = marqueeSeed.filter((_, i) => i % 2 === 0);
  const secondRow = marqueeSeed.filter((_, i) => i % 2 === 1);

  return (
    <div className="container mx-auto space-y-10 px-4 pb-0 pt-0 md:pb-0 md:pt-0">
      <section className="relative overflow-hidden">
        <RetroGrid
          className="pointer-events-none absolute inset-0 opacity-35"
          angle={65}
          cellSize={58}
          lightLineColor="color-mix(in oklab, var(--primary) 45%, transparent)"
          darkLineColor="color-mix(in oklab, var(--primary) 55%, transparent)"
        />
        <div className="relative z-10">
          <LampContainer>
            <motion.h1
              initial={{ opacity: 0.5, y: 100 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{
                delay: 0.3,
                duration: 0.8,
                ease: "easeInOut",
              }}
              className="font-heading bg-linear-to-br from-primary to-primary/75 bg-clip-text py-1 text-center text-5xl leading-[0.95] tracking-tight text-transparent dark:bg-none dark:text-foreground md:text-7xl"
            >
              Turn your thoughts <br /> into timeless content
            </motion.h1>

            <p className="mx-auto mt-6 max-w-3xl text-center text-lg text-muted-foreground">
              Write deeply, publish effortlessly, and connect with readers who value
              quality ideas and authentic perspectives.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              {user ? (
                <ExploreButton onClick={() => router.push("/explore")} />
              ) : (
                <HoverBorderGradient
                  as="button"
                  onClick={() => setAuthOpen(true)}
                  containerClassName="rounded-full"
                  className="flex items-center rounded-full bg-background px-6 py-2.5 text-base font-medium text-foreground"
                >
                  Get Started
                </HoverBorderGradient>
              )}
            </div>
          </LampContainer>
        </div>
      </section>

      <AuthModal open={authOpen} onOpenChange={setAuthOpen} initialTab="register" />

      {reviews.length > 0 && (
        <section className="space-y-4">
          <div className="mx-auto flex w-full max-w-3xl flex-col items-center justify-center px-4">
            <h2 className="font-heading text-3xl md:text-4xl">Featured</h2>
            <div className="w-full max-w-2xl">
              <RisingGlow particleCount={72} particleColor="var(--primary)" height={78} width="100%" />
            </div>
          </div>
          <div className="relative left-1/2 flex w-screen -translate-x-1/2 flex-col items-center justify-center overflow-hidden py-1">
            <Marquee pauseOnHover repeat={6} className="[--duration:20s]">
              {firstRow.map((review, idx) => (
                <FeaturedReviewCard key={`${review.id}-top-${idx}`} {...review} />
              ))}
            </Marquee>

            {secondRow.length > 0 && (
              <Marquee reverse pauseOnHover repeat={6} className="[--duration:20s]">
                {secondRow.map((review, idx) => (
                  <FeaturedReviewCard key={`${review.id}-bottom-${idx}`} {...review} />
                ))}
              </Marquee>
            )}

            <div className="from-background pointer-events-none absolute inset-y-0 left-0 w-1/4 bg-linear-to-r" />
            <div className="from-background pointer-events-none absolute inset-y-0 right-0 w-1/4 bg-linear-to-l" />
          </div>
        </section>
      )}

      {!loading && posts.length === 0 && (
        <section className="mx-auto w-full max-w-3xl rounded-xl bg-muted/20 px-6 py-10 text-center">
          <h2 className="font-heading text-3xl text-foreground">No stories yet</h2>
          <p className="mt-3 text-muted-foreground">Follow more writers or adjust your search to discover fresh ideas.</p>
        </section>
      )}

      <footer className="relative mt-14 overflow-hidden border-t border-border/60 bg-transparent">
        <div className="absolute inset-0 bg-linear-to-b from-transparent via-transparent to-primary/[0.04]" />
        <div className="relative z-10 px-0 py-10 md:py-12">
          <div className="grid grid-cols-1 gap-10 pb-10 md:grid-cols-2 lg:grid-cols-3 lg:gap-14">
            <div className="space-y-4">
              <div className="group relative inline-flex items-end gap-1 pb-1">
                <span className="font-heading text-4xl leading-none tracking-tight text-foreground">
                  We
                </span>
                <span className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">
                  Blog
                </span>
                <span className="pointer-events-none absolute bottom-0 left-0 h-px w-full bg-linear-to-r from-primary/0 via-primary/80 to-primary/0 opacity-80 transition-opacity group-hover:opacity-100" />
              </div>
              <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
                WeBlog is a modern publishing space for thoughtful writing, meaningful discovery, and communities built around ideas.
              </p>
            </div>

            <div>
              <h4 className="mb-5 text-lg font-semibold text-foreground">Contact Us</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-primary" />
                  <a href="mailto:hello@weblog.com" className="transition-colors hover:text-foreground">
                    hello@weblog.com
                  </a>
                </li>
                <li className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-primary" />
                  <a href="tel:+918637373116" className="transition-colors hover:text-foreground">
                    +91 86373 73116
                  </a>
                </li>
                <li className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span>India</span>
                </li>
              </ul>
            </div>

            <div className="lg:justify-self-end">
              <h4 className="mb-5 text-lg font-semibold text-foreground">Connect</h4>
              <div className="flex items-center gap-3 text-muted-foreground">
                <a href="#" aria-label="Share" className="rounded-xl border border-border/55 bg-background/40 p-2 transition hover:text-primary">
                  <Share2 className="h-4 w-4" />
                </a>
                <a href="#" aria-label="RSS" className="rounded-xl border border-border/55 bg-background/40 p-2 transition hover:text-primary">
                  <Rss className="h-4 w-4" />
                </a>
                <a href="#" aria-label="Social" className="rounded-xl border border-border/55 bg-background/40 p-2 transition hover:text-primary">
                  <AtSign className="h-4 w-4" />
                </a>
                <a href="#" aria-label="Globe" className="rounded-xl border border-border/55 bg-background/40 p-2 transition hover:text-primary">
                  <Globe className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-start justify-between gap-3 pt-6 text-sm text-muted-foreground md:flex-row md:items-center">
            <p>© {new Date().getFullYear()} WeBlog. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <Link href="/" className="transition-colors hover:text-foreground">Privacy</Link>
              <Link href="/" className="transition-colors hover:text-foreground">Terms</Link>
            </div>
          </div>
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 hidden justify-center lg:flex">
          <span className="font-heading text-[12rem] leading-none tracking-tight text-foreground/3">
            WeBlog
          </span>
        </div>
      </footer>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-8 md:py-10" />}>
      <HomePageContent />
    </Suspense>
  );
}
