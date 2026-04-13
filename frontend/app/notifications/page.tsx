"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Bell, CheckCircle2Icon, InfoIcon, RefreshCw } from "lucide-react";
import { notificationAPI } from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import type { Notification } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

function formatTimeLabel(date: string) {
  const now = Date.now();
  const target = new Date(date).getTime();
  const diffMs = now - target;

  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 14) return "1W ago";
  if (days < 21) return "2W ago";
  if (days < 28) return "3W ago";
  if (days < 30) return "4W ago";

  return "1M+ ago";
}

function getNotificationText(item: Notification) {
  if (item.type === "follow") {
    return `${item.sender.name} followed you`;
  }

  if (item.type === "post") {
    const topic = item.post?.category || "General";
    return `${item.sender.name} has posted a new post on ${topic}`;
  }

  if (item.type === "like") {
    return item.post?.title
      ? `${item.sender.name} liked your post \"${item.post.title}\"`
      : `${item.sender.name} liked your post`;
  }

  return item.post?.title
    ? `${item.sender.name} commented on \"${item.post.title}\"`
    : `${item.sender.name} commented on your post`;
}

function getNotificationTitle(item: Notification) {
  if (item.type === "follow") return "New follower";
  if (item.type === "post") return "New post";
  if (item.type === "like") return "Post liked";
  return "New comment";
}

function getNotificationIcon(item: Notification) {
  if (item.type === "follow") {
    return <InfoIcon className="text-primary" />;
  }
  return <CheckCircle2Icon className="text-primary" />;
}

function getNotificationHref(item: Notification) {
  if (item.type === "follow") return `/profile/${item.senderid}`;
  if (item.postid) return `/blog/${item.postid}`;
  return "/";
}

const notificationBuckets = [
  "Today",
  "Yesterday",
  "1W ago",
  "2W ago",
  "3W ago",
  "4W ago",
] as const;

type NotificationBucket = (typeof notificationBuckets)[number];
type NotificationFilter = "all" | "unread" | "read";

function getNotificationBucket(date: string): NotificationBucket {
  const now = Date.now();
  const target = new Date(date).getTime();
  const diffMs = now - target;
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 14) return "1W ago";
  if (days < 21) return "2W ago";
  if (days < 28) return "3W ago";
  return "4W ago";
}

export default function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const [activeFilter, setActiveFilter] = useState<NotificationFilter>("all");
  const [markingIds, setMarkingIds] = useState<Record<number, boolean>>({});

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.isRead).length,
    [notifications]
  );

  const filteredNotifications = useMemo(() => {
    if (activeFilter === "unread") {
      return notifications.filter((item) => !item.isRead);
    }
    if (activeFilter === "read") {
      return notifications.filter((item) => item.isRead);
    }
    return notifications;
  }, [notifications, activeFilter]);

  const groupedNotifications = useMemo(() => {
    const groups: Record<NotificationBucket, Notification[]> = {
      Today: [],
      Yesterday: [],
      "1W ago": [],
      "2W ago": [],
      "3W ago": [],
      "4W ago": [],
    };

    filteredNotifications.forEach((item) => {
      const bucket = getNotificationBucket(item.createdAt);
      groups[bucket].push(item);
    });

    return groups;
  }, [filteredNotifications]);

  const hasFilteredItems = useMemo(
    () => Object.values(groupedNotifications).some((items) => items.length > 0),
    [groupedNotifications]
  );

  const fetchNotifications = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    if (!showRefresh) setLoading(true);

    try {
      const res = await notificationAPI.getAll();
      setNotifications(res.data);
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const markOneAsRead = async (id: number) => {
    if (markingIds[id]) {
      return;
    }

    setMarkingIds((current) => ({ ...current, [id]: true }));
    try {
      await notificationAPI.markOneRead(id);
      setNotifications((current) =>
        current.map((item) => (item.id === id ? { ...item, isRead: true } : item))
      );
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("notifications:item-read", { detail: { id } }));
      }
    } catch {
      // Ignore transient failures to keep feed interaction smooth.
    } finally {
      setMarkingIds((current) => ({ ...current, [id]: false }));
    }
  };

  const markAllAsRead = async () => {
    if (markingAll || unreadCount === 0) {
      return;
    }

    setMarkingAll(true);
    try {
      await notificationAPI.markAllRead();
      setNotifications((current) => current.map((item) => ({ ...item, isRead: true })));
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("notifications:read"));
      }
    } catch {
      // Ignore transient failures and keep current unread state.
    } finally {
      setMarkingAll(false);
    }
  };

  useEffect(() => {
    if (!user) {
      setLoading(false);
      setNotifications([]);
      return;
    }

    void fetchNotifications();
  }, [user]);

  if (!user) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-16 text-center">
        <h2 className="text-2xl font-bold mb-2">Sign in required</h2>
        <p className="text-muted-foreground mb-4">
          Please sign in to view notifications.
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

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          <h1 className="text-2xl font-bold">Notifications</h1>
          {unreadCount > 0 && <Badge>{unreadCount} unread</Badge>}
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center rounded-md border border-border bg-background p-1">
            {([
              { key: "all", label: "All" },
              { key: "unread", label: "Unread" },
              { key: "read", label: "Read" },
            ] as Array<{ key: NotificationFilter; label: string }>).map((option) => (
              <button
                key={option.key}
                type="button"
                onClick={() => setActiveFilter(option.key)}
                className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                  activeFilter === option.key
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void fetchNotifications(true)}
            disabled={refreshing}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void markAllAsRead()}
            disabled={markingAll || unreadCount === 0}
          >
            {markingAll ? "Marking..." : "Mark all read"}
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="rounded-lg border p-3">
              <Skeleton className="mb-2 h-4 w-2/3" />
                <Skeleton className="h-4 w-24" />
            </div>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <Alert>
          <InfoIcon className="text-primary" />
          <AlertTitle>No notifications yet</AlertTitle>
          <AlertDescription>
            When someone follows, likes, or comments, you will see updates here.
          </AlertDescription>
        </Alert>
      ) : !hasFilteredItems ? (
        <Alert>
          <InfoIcon className="text-primary" />
          <AlertTitle>No matching notifications</AlertTitle>
          <AlertDescription>
            Try another filter to see more updates.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-6">
          {notificationBuckets.map((bucket) => {
            const items = groupedNotifications[bucket];
            if (!items.length) {
              return null;
            }

            return (
              <section key={bucket} className="space-y-3">
                <h2 className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                  {bucket}
                </h2>
                <div className="space-y-3">
                  {items.map((item) => (
                    <Link href={getNotificationHref(item)} key={item.id}>
                      <Alert className="transition-colors hover:bg-muted/30">
                        {getNotificationIcon(item)}
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <AlertTitle>{getNotificationTitle(item)}</AlertTitle>
                            <AlertDescription>
                              {getNotificationText(item)}
                            </AlertDescription>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {formatTimeLabel(item.createdAt)}
                            </p>
                          </div>
                          {!item.isRead && (
                            <button
                              type="button"
                              onClick={(event) => {
                                event.preventDefault();
                                event.stopPropagation();
                                void markOneAsRead(item.id);
                              }}
                              disabled={Boolean(markingIds[item.id])}
                              className="rounded-full border border-border px-2 py-0.5 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-70"
                            >
                              {markingIds[item.id] ? "Marking..." : "Mark read"}
                            </button>
                          )}
                        </div>
                      </Alert>
                    </Link>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
