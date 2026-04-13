"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bookmark, FolderOpen } from "lucide-react";

import { useAuth } from "@/context/auth-context";
import { bookmarkAPI } from "@/lib/api";
import type { BookmarkList } from "@/lib/types";
import { BlogCard } from "@/components/blog-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function BookmarksPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [lists, setLists] = useState<BookmarkList[]>([]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/explore");
    }
  }, [authLoading, router, user]);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchBookmarks = async () => {
      setLoading(true);
      try {
        const res = await bookmarkAPI.getAll();
        setLists(res.data);
      } catch {
        setLists([]);
      } finally {
        setLoading(false);
      }
    };

    void fetchBookmarks();
  }, [user]);

  if (authLoading || !user) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="text-muted-foreground">Redirecting to Explore...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center gap-2">
        <Bookmark className="h-5 w-5" />
        <h1 className="text-2xl font-bold">Bookmarked Blogs</h1>
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : lists.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5" />
              No bookmarks yet
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Start bookmarking blogs and organize them into custom lists.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {lists.map((list) => (
            <section key={list.id} className="space-y-4">
              {(() => {
                const items = list.items || [];
                return (
                  <>
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">{list.name}</h2>
                <span className="text-xs text-muted-foreground">{items.length} saved</span>
              </div>

              {items.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-sm text-muted-foreground">
                    No blogs in this list yet.
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {items.map((item) => (
                    <BlogCard key={item.id} post={item.post} />
                  ))}
                </div>
              )}
                  </>
                );
              })()}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
