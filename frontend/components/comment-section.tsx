"use client";

import { useState, useEffect } from "react";
import { commentAPI } from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import type { Comment } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Loader2, Trash2, MessageCircle } from "lucide-react";
import { toast } from "sonner";

interface CommentSectionProps {
  postId: number;
}

export function CommentSection({ postId }: CommentSectionProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchComments = async () => {
      try {
        const res = await commentAPI.getByPostId(postId);
        setComments(res.data);
      } catch {
        setComments([]);
      } finally {
        setLoading(false);
      }
    };
    fetchComments();
  }, [postId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please sign in to comment");
      return;
    }
    if (!content.trim()) return;

    setSubmitting(true);
    try {
      const res = await commentAPI.create(postId, content.trim());
      setComments((prev) => [
        { ...res.data, user: { id: user.id, name: user.name, email: user.email } },
        ...prev,
      ]);
      setContent("");
      toast.success("Comment posted");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to post comment");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId: number) => {
    try {
      await commentAPI.delete(commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      toast.success("Comment deleted");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to delete comment");
    }
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <MessageCircle className="h-5 w-5" />
        <h3 className="text-lg font-semibold">
          Comments ({comments.length})
        </h3>
      </div>

      {/* Comment Form */}
      {user ? (
        <form onSubmit={handleSubmit} className="space-y-3">
          <Textarea
            placeholder="Write a comment..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
          />
          <div className="flex justify-end">
            <Button type="submit" size="sm" disabled={submitting || !content.trim()}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Post Comment
            </Button>
          </div>
        </form>
      ) : (
        <p className="text-sm text-muted-foreground">
          Sign in to leave a comment.
        </p>
      )}

      <Separator />

      {/* Comments List */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse space-y-2">
              <div className="h-4 w-32 bg-muted rounded" />
              <div className="h-4 w-full bg-muted rounded" />
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          No comments yet. Be the first to share your thoughts!
        </p>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div
              key={comment.id}
              className="group rounded-lg border p-4 space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-xs">
                      {comment.user?.name?.charAt(0)?.toUpperCase() ||
                        String(comment.userid).charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">
                    {comment.user?.name || `User ${comment.userid}`}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(comment.createdAt)}
                  </span>
                </div>
                {user && user.id === comment.userid && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleDelete(comment.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                )}
              </div>
              <p className="text-sm leading-relaxed">{comment.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
