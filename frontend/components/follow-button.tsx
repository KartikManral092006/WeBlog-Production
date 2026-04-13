"use client";

import { useState } from "react";
import { followAPI } from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { UserPlus, UserMinus } from "lucide-react";
import { toast } from "sonner";

interface FollowButtonProps {
  targetUserId: number;
  initialFollowing?: boolean;
  size?: "default" | "sm";
}

export function FollowButton({
  targetUserId,
  initialFollowing = false,
  size = "sm",
}: FollowButtonProps) {
  const { user } = useAuth();
  const [following, setFollowing] = useState(initialFollowing);
  const [loading, setLoading] = useState(false);

  if (!user || user.id === targetUserId) {
    return null;
  }

  const handleFollowToggle = async () => {
    setLoading(true);
    try {
      if (following) {
        await followAPI.unfollow(targetUserId);
        setFollowing(false);
        toast.success("Unfollowed");
      } else {
        await followAPI.follow(targetUserId);
        setFollowing(true);
        toast.success("Following");
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update follow");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant={following ? "outline" : "default"}
      size={size}
      onClick={handleFollowToggle}
      disabled={loading}
    >
      {following ? (
        <UserMinus className="mr-2 h-4 w-4" />
      ) : (
        <UserPlus className="mr-2 h-4 w-4" />
      )}
      {following ? "Following" : "Follow"}
    </Button>
  );
}
