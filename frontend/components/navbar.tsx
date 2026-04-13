"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { notificationAPI } from "@/lib/api";
import type { Notification } from "@/lib/types";
import { AuthModal } from "@/components/auth-modal";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GooeyInput } from "@/components/ui/gooey-input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Bell, Menu, User, Bookmark, Clock3, CalendarClock, FileText, PenSquare, Compass, Sparkles, LogOut } from "lucide-react";

function formatNotificationTime(date: string) {
  const now = Date.now();
  const target = new Date(date).getTime();
  const diffMs = now - target;
  const minutes = Math.floor(diffMs / (1000 * 60));

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getNotificationText(item: Notification) {
  if (item.type === "follow") return `${item.sender.name} followed you`;
  if (item.type === "post") {
    const topic = item.post?.category || "General";
    return `${item.sender.name} published a new post in ${topic}`;
  }
  if (item.type === "like") {
    return item.post?.title
      ? `${item.sender.name} liked "${item.post.title}"`
      : `${item.sender.name} liked your post`;
  }
  return item.post?.title
    ? `${item.sender.name} commented on "${item.post.title}"`
    : `${item.sender.name} commented on your post`;
}

function getNotificationHref(item: Notification) {
  if (item.type === "follow") return `/profile/${item.senderid}`;
  if (item.postid) return `/blog/${item.postid}`;
  return "/notifications";
}

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [authTab, setAuthTab] = useState<"login" | "register">("login");
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const params = new URLSearchParams(window.location.search);
    setSearchText(params.get("q") ?? "");
  }, [pathname]);

  useEffect(() => {
    if (!user) {
      return;
    }

    let isCancelled = false;

    const loadNotifications = async () => {
      try {
        const res = await notificationAPI.getAll();
        if (!isCancelled) {
          setNotifications(res.data);
          const unread = res.data.filter((item) => !item.isRead).length;
          setUnreadCount(unread);
        }
      } catch {
        if (!isCancelled) {
          setNotifications([]);
          setUnreadCount(0);
        }
      }
    };

    void loadNotifications();

    const intervalId = setInterval(() => {
      void loadNotifications();
    }, 60000);

    return () => {
      isCancelled = true;
      clearInterval(intervalId);
    };
  }, [user]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handleNotificationsRead = () => {
      setNotifications((current) => current.map((item) => ({ ...item, isRead: true })));
      setUnreadCount(0);
    };

    const handleNotificationItemRead = (event: Event) => {
      const customEvent = event as CustomEvent<{ id?: number }>;
      const notificationId = Number(customEvent.detail?.id);
      if (!notificationId) {
        return;
      }

      setNotifications((current) =>
        current.map((item) => (item.id === notificationId ? { ...item, isRead: true } : item))
      );
      setUnreadCount((current) => Math.max(0, current - 1));
    };

    window.addEventListener("notifications:read", handleNotificationsRead);
    window.addEventListener("notifications:item-read", handleNotificationItemRead as EventListener);
    return () => {
      window.removeEventListener("notifications:read", handleNotificationsRead);
      window.removeEventListener("notifications:item-read", handleNotificationItemRead as EventListener);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      router.push("/");
      router.refresh();
    }
  };

  const handleSearch = () => {
    const q = searchText.trim();
    if (!q) {
      router.push("/explore");
      return;
    }
    const encoded = encodeURIComponent(q);
    router.push(`/explore?q=${encoded}`);
  };

  const openLoginModal = () => {
    setAuthTab("login");
    setAuthOpen(true);
  };

  const openRegisterModal = () => {
    setAuthTab("register");
    setAuthOpen(true);
  };

  const markAllNotificationsAsRead = async () => {
    try {
      await notificationAPI.markAllRead();
      setNotifications((current) => current.map((item) => ({ ...item, isRead: true })));
      setUnreadCount(0);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("notifications:read"));
      }
    } catch {
      // Ignore transient failures in navbar popover action.
    }
  };

  const markNotificationAsRead = async (id: number, isRead: boolean) => {
    if (isRead) {
      return;
    }

    try {
      await notificationAPI.markOneRead(id);
      setNotifications((current) =>
        current.map((item) => (item.id === id ? { ...item, isRead: true } : item))
      );
      setUnreadCount((current) => Math.max(0, current - 1));
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("notifications:item-read", { detail: { id } }));
      }
    } catch {
      // Ignore transient failures in popover read action.
    }
  };

  const recentNotifications = notifications.slice(0, 6);
  const menuItemClass = "flex h-9 items-center rounded-md px-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/70 bg-background/85 backdrop-blur-xl supports-backdrop-filter:bg-background/70">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="group relative inline-flex items-end gap-1 pb-1">
            <span className="font-heading text-4xl leading-none tracking-tight text-foreground">
              We
            </span>
            <span className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">
              Blog
            </span>
            <span className="pointer-events-none absolute bottom-0 left-0 h-px w-full bg-linear-to-r from-primary/0 via-primary/80 to-primary/0 opacity-80 transition-opacity group-hover:opacity-100" />
          </Link>

          <nav className="hidden md:flex items-center gap-5 text-xs font-semibold uppercase tracking-[0.12em]">
            <Link
              href="/"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              Home
            </Link>
            <Link
              href="/explore"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              Explore
            </Link>
            <Link
              href="/for-you"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              For You
            </Link>
          </nav>
        </div>

        <div className="hidden max-w-sm flex-1 md:block">
          <GooeyInput
            value={searchText}
            onValueChange={setSearchText}
            onInputKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSearch();
              }
            }}
            placeholder="Search stories"
          />
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          {user ? (
            <>
              <Link href="/blog/new" className="hidden sm:block">
                <Button variant="outline" size="sm" className="border-border/70 bg-background/70">
                  <PenSquare className="mr-2 h-4 w-4" />
                  Write
                </Button>
              </Link>

              <Sheet>
                <SheetTrigger
                  render={<Button variant="ghost" size="icon" className="hidden md:inline-flex" />}
                >
                  <Menu className="h-4 w-4" />
                </SheetTrigger>
                <SheetContent side="right" className="w-80">
                  <SheetHeader>
                    <SheetTitle>Menu</SheetTitle>
                  </SheetHeader>
                  <nav className="mt-6 grid gap-3 text-sm">
                    <Link href="/bookmarks" className={menuItemClass}>
                      <Bookmark className="mr-2 h-4 w-4" />
                      Bookmarks
                    </Link>
                    <Link href="/history" className={menuItemClass}>
                      <Clock3 className="mr-2 h-4 w-4" />
                      History
                    </Link>
                    <Link href="/drafts" className={menuItemClass}>
                      <FileText className="mr-2 h-4 w-4" />
                      Drafts
                    </Link>
                    <Link href="/scheduled" className={menuItemClass}>
                      <CalendarClock className="mr-2 h-4 w-4" />
                      Scheduled
                    </Link>
                    <Link href="/notifications" className={menuItemClass}>
                      <Bell className="mr-2 h-4 w-4" />
                      Notifications
                    </Link>
                  </nav>
                </SheetContent>
              </Sheet>

              <Popover open={notificationsOpen} onOpenChange={setNotificationsOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="relative"
                    aria-label="Open notifications"
                    onMouseEnter={() => setNotificationsOpen(true)}
                    onMouseLeave={() => setNotificationsOpen(false)}
                  >
                    <Bell className="h-4 w-4" />
                    {unreadCount > 0 && (
                      <Badge className="absolute -top-1.5 left-full min-w-5 -translate-x-1/2 rounded-full bg-primary px-1 text-[10px] text-primary-foreground">
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  align="end"
                  className="w-88 p-1"
                  onMouseEnter={() => setNotificationsOpen(true)}
                  onMouseLeave={() => setNotificationsOpen(false)}
                >
                  <div className="flex items-baseline justify-between gap-4 px-3 py-2">
                    <div className="text-sm font-semibold">Notifications</div>
                    {unreadCount > 0 && (
                      <button className="text-xs font-medium text-primary hover:underline" onClick={() => void markAllNotificationsAsRead()}>
                        Mark all as read
                      </button>
                    )}
                  </div>
                  <div className="-mx-1 my-1 h-px bg-border" />

                  {recentNotifications.length === 0 ? (
                    <div className="px-3 py-6 text-center text-xs text-muted-foreground">
                      No notifications yet
                    </div>
                  ) : (
                    <div className="max-h-96 space-y-1 overflow-y-auto pb-1">
                      {recentNotifications.map((notification) => (
                        <Link
                          key={notification.id}
                          href={getNotificationHref(notification)}
                          className="block rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent"
                          onClick={() => {
                            void markNotificationAsRead(notification.id, notification.isRead);
                            setNotificationsOpen(false);
                          }}
                        >
                          <div className="relative flex items-start gap-3 pe-3">
                            <Avatar size="sm">
                              <AvatarFallback>
                                {notification.sender.name?.charAt(0)?.toUpperCase() || "U"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1 space-y-1">
                              <p className="line-clamp-2 text-foreground/85">
                                <span className="font-medium text-foreground">{notification.sender.name}</span>{" "}
                                {getNotificationText(notification).replace(`${notification.sender.name} `, "")}
                              </p>
                              <div className="text-xs text-muted-foreground">{formatNotificationTime(notification.createdAt)}</div>
                            </div>
                            {!notification.isRead && (
                              <span className="absolute inset-e-0 top-1.5 inline-block h-2 w-2 rounded-full bg-primary" />
                            )}
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}

                  <div className="-mx-1 mt-1 h-px bg-border" />
                  <div className="px-3 py-2">
                    <Link
                      href="/notifications"
                      className="block text-center text-xs font-medium text-primary hover:underline"
                      onClick={() => setNotificationsOpen(false)}
                    >
                      View all notifications
                    </Link>
                  </div>
                </PopoverContent>
              </Popover>

              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full" />
                  }
                >
                  <Avatar size="sm">
                    <AvatarImage src={user.avatar || ""} alt={user.name} />
                    <AvatarFallback>
                      {user.name?.charAt(0)?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="flex items-center gap-2 p-2">
                    <Avatar size="sm">
                      <AvatarImage src={user.avatar || ""} alt={user.name} />
                      <AvatarFallback>
                        {user.name?.charAt(0)?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col space-y-0.5">
                      <p className="text-sm font-medium">{user.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    render={<Link href={`/profile/${user.id}`} />}
                  >
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    render={<Link href="/bookmarks" />}
                  >
                    <Bookmark className="mr-2 h-4 w-4" />
                    Bookmarks
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    render={<Link href="/history" />}
                  >
                    <Clock3 className="mr-2 h-4 w-4" />
                    History
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    render={<Link href="/drafts" />}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Drafts
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    render={<Link href="/scheduled" />}
                  >
                    <CalendarClock className="mr-2 h-4 w-4" />
                    Scheduled
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    render={<Link href="/blog/new" />}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Write a Post
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="border-border/70 bg-background/70"
                onClick={openLoginModal}
              >
                Sign In
              </Button>
              <Button size="sm" className="bg-primary text-primary-foreground" onClick={openRegisterModal}>
                Get Started
              </Button>
            </div>
          )}
        </div>

        {/* Mobile menu */}
        <Sheet>
          <SheetTrigger
            render={
              <Button variant="ghost" size="icon" className="md:hidden" />
            }
          >
            <Menu className="h-5 w-5" />
          </SheetTrigger>
          <SheetContent side="right">
            <SheetHeader>
              <SheetTitle>
                <span className="font-heading tracking-tight text-foreground">We</span>{" "}
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Blog</span>
              </SheetTitle>
            </SheetHeader>
            <nav className="mt-6 flex flex-col gap-3">
              <Link
                href="/"
                className={menuItemClass}
              >
                Home
              </Link>
              {user ? (
                <>
                  <Link
                    href="/explore"
                    className={menuItemClass}
                  >
                    <Compass className="mr-2 h-4 w-4" />
                    Explore
                  </Link>
                  <Link
                    href="/for-you"
                    className={menuItemClass}
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    For You
                  </Link>
                  <Link
                    href="/bookmarks"
                    className={menuItemClass}
                  >
                    <Bookmark className="mr-2 h-4 w-4" />
                    Bookmarks
                  </Link>
                  <Link
                    href="/history"
                    className={menuItemClass}
                  >
                    <Clock3 className="mr-2 h-4 w-4" />
                    History
                  </Link>
                  <Link
                    href="/drafts"
                    className={menuItemClass}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Drafts
                  </Link>
                  <Link
                    href="/scheduled"
                    className={menuItemClass}
                  >
                    <CalendarClock className="mr-2 h-4 w-4" />
                    Scheduled
                  </Link>
                  <Link
                    href="/notifications"
                    className={menuItemClass}
                  >
                    <Bell className="mr-2 h-4 w-4" />
                    Notifications
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/explore"
                    className={menuItemClass}
                  >
                    <Compass className="mr-2 h-4 w-4" />
                    Explore
                  </Link>
                  <button
                    onClick={openLoginModal}
                    className={`${menuItemClass} w-full text-left`}
                  >
                    Sign In
                  </button>
                  <button
                    onClick={openRegisterModal}
                    className="flex h-9 items-center rounded-md px-2 text-sm text-primary transition-colors hover:bg-accent hover:text-primary/80"
                  >
                    Get Started
                  </button>
                </>
              )}
              <div className="pt-2">
                <ThemeToggle />
              </div>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
      <AuthModal open={authOpen} onOpenChange={setAuthOpen} initialTab={authTab} />
    </header>
  );
}
