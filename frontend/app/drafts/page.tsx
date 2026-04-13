"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { blogAPI } from "@/lib/api";
import type { Post } from "@/lib/types";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, FileText, PencilLine, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { getExcerptFromHtml } from "@/lib/content-preview";

export default function DraftsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/explore");
    }
  }, [authLoading, router, user]);

  const handleDeleteDraft = async (postId: number) => {
    const shouldDelete = window.confirm("Delete this draft?");
    if (!shouldDelete) {
      return;
    }

    try {
      setDeletingId(postId);
      await blogAPI.delete(postId);
      setPosts((prev) => prev.filter((item) => item.id !== postId));
      toast.success("Draft deleted");
    } catch {
      toast.error("Failed to delete draft");
    } finally {
      setDeletingId(null);
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        const res = await blogAPI.getDraftsMine();
        setPosts(res.data || []);
      } catch {
        toast.error("Failed to load drafts");
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      void load();
    } else {
      setLoading(false);
    }
  }, [user]);

  if (authLoading || !user) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="text-muted-foreground">Redirecting to Explore...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <Link href="/">
        <Button variant="ghost" size="sm" className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </Link>

      <div className="mb-6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          <h1 className="text-2xl font-bold">My Drafts</h1>
        </div>
        <Badge variant="secondary" className="rounded-full px-3 py-1">
          {posts.length} drafts
        </Badge>
      </div>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : posts.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <FileText className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
            <p className="text-muted-foreground">No drafts found.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <Card key={post.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="line-clamp-1 text-xl">
                      {post.title?.trim() || "Untitled Draft"}
                    </CardTitle>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Last updated {new Date(post.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <Badge variant="outline">Draft</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="line-clamp-2 text-sm text-muted-foreground">
                  {getExcerptFromHtml(post.content, 180) || "No content yet."}
                </p>
                <div className="mt-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link href={`/blog/${post.id}/edit`}>
                      <Button size="sm" variant="outline">
                        <PencilLine className="mr-2 h-4 w-4" />
                        Continue Writing
                      </Button>
                    </Link>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        void handleDeleteDraft(post.id);
                      }}
                      disabled={deletingId === post.id}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      {deletingId === post.id ? "Deleting..." : "Delete Draft"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
