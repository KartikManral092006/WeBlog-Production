"use client";

import { useEffect, useMemo, useState } from "react";
import { Bookmark } from "lucide-react";
import { toast } from "sonner";

import { bookmarkAPI } from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface BookmarkButtonProps {
  postId: number;
}

export function BookmarkButton({ postId }: BookmarkButtonProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [lists, setLists] = useState<Array<{ id: number; name: string }>>([]);
  const [selectedListId, setSelectedListId] = useState<number | null>(null);
  const [newListName, setNewListName] = useState("");
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [loading, setLoading] = useState(false);

  const selectedList = useMemo(
    () => lists.find((list) => list.id === selectedListId) || null,
    [lists, selectedListId]
  );

  const loadBookmarkMeta = async () => {
    if (!user) return;
    const [listsRes, statusRes] = await Promise.all([
      bookmarkAPI.getLists(),
      bookmarkAPI.getPostStatus(postId),
    ]);

    const normalizedLists = listsRes.data.map((list) => ({
      id: list.id,
      name: list.name,
    }));

    setLists(normalizedLists);
    setIsBookmarked(statusRes.data.isBookmarked);

    if (statusRes.data.lists.length > 0) {
      setSelectedListId(statusRes.data.lists[0].id);
    } else if (normalizedLists.length > 0) {
      setSelectedListId(normalizedLists[0].id);
    }
  };

  useEffect(() => {
    if (!user) return;

    const loadStatus = async () => {
      try {
        await loadBookmarkMeta();
      } catch {
        setIsBookmarked(false);
      }
    };

    void loadStatus();
  }, [postId, user]);

  if (!user) {
    return (
      <Button variant="ghost" size="sm" disabled title="Sign in to bookmark">
        <Bookmark className="mr-1 h-4 w-4" />
        Save
      </Button>
    );
  }

  const saveToList = async () => {
    setLoading(true);
    try {
      if (newListName.trim()) {
        await bookmarkAPI.add(postId, undefined, newListName.trim());
      } else if (selectedList) {
        await bookmarkAPI.add(postId, selectedList.id);
      } else {
        await bookmarkAPI.add(postId, undefined, "Saved");
      }

      setIsBookmarked(true);
      setOpen(false);
      setNewListName("");
      await loadBookmarkMeta();
      toast.success("Blog bookmarked");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to bookmark blog");
    } finally {
      setLoading(false);
    }
  };

  const removeFromBookmarks = async () => {
    setLoading(true);
    try {
      await bookmarkAPI.remove(postId);
      setIsBookmarked(false);
      setOpen(false);
      await loadBookmarkMeta();
      toast.success("Removed from bookmarks");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to remove bookmark");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
        disabled={loading}
        className={isBookmarked ? "text-amber-600" : ""}
      >
        <Bookmark className={`mr-1 h-4 w-4 ${isBookmarked ? "fill-current" : ""}`} />
        {isBookmarked ? "Saved" : "Save"}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save to list</DialogTitle>
            <DialogDescription>
              Choose an existing list or create a new one.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Choose Existing List</Label>
              <div className="grid grid-cols-1 gap-2">
                {lists.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No lists yet. Create one below.</p>
                ) : (
                  lists.map((list) => (
                    <button
                      key={list.id}
                      type="button"
                      onClick={() => {
                        setSelectedListId(list.id);
                        setNewListName("");
                      }}
                      className={`rounded-md border px-3 py-2 text-left text-sm transition ${
                        selectedListId === list.id
                          ? "border-primary bg-primary/10"
                          : "border-border hover:bg-muted"
                      }`}
                    >
                      {list.name}
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-list">Or Create New List</Label>
              <Input
                id="new-list"
                placeholder="e.g. Frontend ideas"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2">
              {isBookmarked && (
                <Button variant="outline" onClick={() => void removeFromBookmarks()}>
                  Remove
                </Button>
              )}
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => void saveToList()} disabled={loading}>
                Save Blog
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
