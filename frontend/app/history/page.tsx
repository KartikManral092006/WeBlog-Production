"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Clock3, Trash2 } from "lucide-react";

import { useAuth } from "@/context/auth-context";
import { historyAPI } from "@/lib/api";
import type { ReadHistoryItem } from "@/lib/types";
import { BlogCard } from "@/components/blog-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export default function HistoryPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<ReadHistoryItem[]>([]);

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

    const fetchHistory = async () => {
      setLoading(true);
      try {
        const res = await historyAPI.getMyHistory();
        setHistory(res.data);
      } catch {
        setHistory([]);
      } finally {
        setLoading(false);
      }
    };

    void fetchHistory();
  }, [user]);

  const clearHistory = async () => {
    try {
      await historyAPI.clearMyHistory();
      setHistory([]);
      toast.success("History cleared");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to clear history");
    }
  };

  if (authLoading || !user) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="text-muted-foreground">Redirecting to Explore...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Clock3 className="h-5 w-5" />
          <h1 className="text-2xl font-bold">Reading History</h1>
        </div>
        {history.length > 0 && (
          <Button variant="outline" size="sm" onClick={() => void clearHistory()}>
            <Trash2 className="mr-2 h-4 w-4" />
            Clear History
          </Button>
        )}
      </div>

      <p className="mb-6 text-sm text-muted-foreground">
        Shows blogs you read in the last 30 days. Older entries are automatically removed.
      </p>

      {loading ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-3 rounded-lg border p-6">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-4 w-full" />
            </div>
          ))}
        </div>
      ) : history.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No history yet</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Open blogs to build your reading history.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {history.map((item) => (
            <div key={item.id} className="space-y-2">
              <BlogCard post={item.post} />
              <p className="px-1 text-xs text-muted-foreground">
                Read on {new Date(item.lastReadAt).toLocaleDateString("en-US", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
