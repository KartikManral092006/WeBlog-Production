"use client";

import { useState } from "react";
import { likeAPI } from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { toast } from "sonner";

interface LikeButtonProps {
  postId: number;
  initialLiked?: boolean;
}

export function LikeButton({ postId, initialLiked = false }: LikeButtonProps) {
  const { user } = useAuth();
  const [liked, setLiked] = useState(initialLiked);
  const [loading, setLoading] = useState(false);

  const handleLike = async () => {
    if (!user) {
      toast.error("Please sign in to like posts");
      return;
    }
    setLoading(true);
    try {
      if (liked) {
        await likeAPI.unlike(postId);
        setLiked(false);
      } else {
        await likeAPI.like(postId);
        setLiked(true);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update like";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleLike}
      disabled={loading}
      className={liked ? "text-red-500 hover:text-red-600" : "text-muted-foreground"}
    >
      <Heart className={`h-4 w-4 mr-1 ${liked ? "fill-current" : ""}`} />
      {liked ? "Liked" : "Like"}
    </Button>
  );
}