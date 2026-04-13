"use client";

import { useState } from "react";
import { Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface ShareButtonProps {
  postId: number;
  title: string;
  size?: "default" | "sm" | "lg" | "icon";
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  showLabel?: boolean;
  className?: string;
}

export function ShareButton({
  postId,
  title,
  size = "sm",
  variant = "outline",
  showLabel = true,
  className,
}: ShareButtonProps) {
  const [sharing, setSharing] = useState(false);

  const handleShare = async () => {
    if (sharing || typeof window === "undefined") {
      return;
    }

    const shareUrl = `${window.location.origin}/blog/${postId}`;
    setSharing(true);

    try {
      if (navigator.share) {
        await navigator.share({
          title,
          text: `Check out this blog: ${title}`,
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        toast.success("Share link copied to clipboard");
      }
    } catch (error) {
      // AbortError is expected when user dismisses native share sheet.
      if (error instanceof Error && error.name !== "AbortError") {
        try {
          await navigator.clipboard.writeText(shareUrl);
          toast.success("Share link copied to clipboard");
        } catch {
          toast.error("Unable to share this blog right now");
        }
      }
    } finally {
      setSharing(false);
    }
  };

  return (
    <Button
      type="button"
      size={size}
      variant={variant}
      className={className}
      onClick={handleShare}
      disabled={sharing}
      aria-label="Share this blog"
      title="Share"
    >
      <Share2 className={showLabel ? "mr-2 h-4 w-4" : "h-4 w-4"} />
      {showLabel ? "Share" : null}
    </Button>
  );
}
