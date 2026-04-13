"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { blogAPI } from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, ArrowLeft, ImagePlus, Link2, Code2, Eye, ChevronDown } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { generateTitlePreviewImage } from "@/lib/preview";
import { BlogRichEditor } from "@/components/editor/blog-rich-editor";
import { FeaturedImageCropper } from "@/components/editor/featured-image-cropper";
import type { Editor } from "@tiptap/react";
import sanitizeHtml from "sanitize-html";
import { COMMON_POST_TAGS } from "@/lib/post-tags";

export default function EditBlogPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [previewImage, setPreviewImage] = useState("");
  const [previewImageName, setPreviewImageName] = useState("");
  const [cropOpen, setCropOpen] = useState(false);
  const [pendingImageSrc, setPendingImageSrc] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [visibility, setVisibility] = useState<"PUBLIC" | "PRIVATE">("PUBLIC");
  const [publishAt, setPublishAt] = useState("");
  const [content, setContent] = useState("");
  const [contentText, setContentText] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [editorInstance, setEditorInstance] = useState<Editor | null>(null);

  const allowedHtmlConfig = {
    allowedTags: [
      "p",
      "h2",
      "h3",
      "h4",
      "ul",
      "ol",
      "li",
      "blockquote",
      "code",
      "pre",
      "strong",
      "em",
      "a",
      "br",
    ],
    allowedAttributes: {
      a: ["href", "target", "rel"],
    },
    allowedSchemes: ["http", "https", "mailto"],
  } satisfies sanitizeHtml.IOptions;

  const postId = Number(params.id);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((item) => item !== tag) : [...prev, tag]
    );
  };

  const isScheduled = Boolean(publishAt);
  const isFutureSchedule = publishAt ? new Date(publishAt).getTime() > Date.now() : false;
  const hasDraftContent = Boolean(
    title.trim() || contentText.trim() || previewImage.trim() || selectedTags.length
  );

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload a valid image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Featured image must be under 5MB");
      return;
    }

    try {
      setPreviewImageName(file.name);
      const imageDataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ""));
        reader.onerror = () => reject(new Error("Failed to read image file"));
        reader.readAsDataURL(file);
      });
      setPendingImageSrc(imageDataUrl);
      setCropOpen(true);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Unable to process image");
    }
  };

  const handleCropSave = (croppedDataUrl: string) => {
    setPreviewImage(croppedDataUrl);
    setCropOpen(false);
    setPendingImageSrc(null);
    toast.success("Featured image updated in editor");
  };

  const handleAddLink = () => {
    if (!editorInstance) {
      return;
    }

    const url = window.prompt("Enter link URL (https://...)");
    if (!url?.trim()) {
      return;
    }
    const text = window.prompt("Enter link text")?.trim() || "Read more";

    editorInstance
      .chain()
      .focus()
      .insertContent(`<a href="${url.trim()}" target="_blank" rel="noopener noreferrer">${text}</a>`)
      .run();
  };

  const handleAddCodeBlock = () => {
    if (!editorInstance) {
      return;
    }
    editorInstance.chain().focus().toggleCodeBlock().run();
  };

  const toLocalInputValue = (iso: string | null | undefined) => {
    if (!iso) {
      return "";
    }

    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) {
      return "";
    }

    const pad = (value: number) => String(value).padStart(2, "0");
    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const res = await blogAPI.getById(postId);
        setTitle(res.data.title);
        setContent(res.data.content);
        setContentText(String(res.data.content || "").replace(/<[^>]+>/g, " ").trim());
        setPreviewImage(res.data.previewImage || "");
        setSelectedTags(res.data.tags || []);
        setVisibility(res.data.visibility || "PUBLIC");
        setPublishAt(toLocalInputValue(res.data.publishAt));
        setPreviewImageName("");
      } catch {
        toast.error("Failed to load post");
      } finally {
        setLoading(false);
      }
    };
    if (postId) fetchPost();
  }, [postId]);

  if (!user) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-16 text-center">
        <h2 className="text-2xl font-bold mb-2">Sign in required</h2>
        <p className="text-muted-foreground mb-4">
          You need to be signed in to edit posts.
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !contentText.trim()) {
      toast.error("Title and content are required");
      return;
    }
    setSubmitting(true);
    try {
      await blogAPI.update(
        postId,
        title.trim(),
        content.trim(),
        previewImage.trim() || null,
        selectedTags,
        visibility,
        publishAt ? new Date(publishAt).toISOString() : null,
        "PUBLISHED"
      );
      if (isFutureSchedule) {
        toast.success("Post moved to scheduling queue!");
        router.push("/scheduled");
      } else {
        toast.success("Post published!");
        router.push(`/blog/${postId}`);
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update post");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!hasDraftContent) {
      return;
    }

    setSubmitting(true);
    try {
      await blogAPI.update(
        postId,
        title.trim(),
        content.trim(),
        previewImage.trim() || null,
        selectedTags,
        visibility,
        publishAt ? new Date(publishAt).toISOString() : null,
        "DRAFT"
      );
      toast.success("Draft saved");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to save draft");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-8 space-y-4">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 md:py-10">
      <Link href={`/blog/${postId}`}>
        <Button variant="ghost" size="sm" className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Post
        </Button>
      </Link>

      <form onSubmit={handleSubmit} className="lg:grid lg:grid-cols-[minmax(0,1fr)_280px] lg:items-start lg:gap-8">
        <div className="space-y-7 lg:border-r lg:border-border/70 lg:pr-8">
          <label className="block cursor-pointer rounded-2xl bg-muted/35 px-5 py-5 text-center transition hover:bg-muted/45 sm:px-8 sm:py-7">
            {previewImage ? (
              <img
                src={previewImage}
                alt="Featured preview"
                className="mb-4 max-h-[22rem] w-full rounded-xl object-contain bg-muted/20"
              />
            ) : (
              <ImagePlus className="mx-auto mb-3 h-9 w-9 text-muted-foreground" />
            )}
            <p className="text-base font-medium text-foreground/80">Add Featured Image</p>
            <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
              Any image dimension supported
            </p>
            {previewImageName ? (
              <p className="mt-2 text-xs text-muted-foreground">{previewImageName}</p>
            ) : null}
            <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          </label>

          <input
            type="url"
            placeholder="Or paste featured image URL"
            value={previewImage.startsWith("data:") ? "" : previewImage}
            onChange={(e) => {
              setPreviewImage(e.target.value);
              setPreviewImageName("");
            }}
            className="w-full bg-transparent px-0 py-1 text-sm text-muted-foreground placeholder:text-muted-foreground/70 outline-none"
          />

          <input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="Enter your title..."
            className="font-heading w-full bg-transparent px-0 text-5xl font-semibold leading-tight tracking-tight text-foreground placeholder:text-foreground/20 outline-none md:text-6xl"
          />

          <div className="flex flex-wrap items-center gap-2 text-muted-foreground">
            <Button type="button" size="sm" variant="ghost" onClick={handleAddLink} className="h-8 px-2">
              <Link2 className="h-4 w-4" />
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={handleAddCodeBlock} className="h-8 px-2">
              <Code2 className="h-4 w-4" />
            </Button>
            <span className="text-xs">
              Shortcuts: # H2, ## H3, * bullet list, 1. numbered list, &gt; quote, ``` code block
            </span>
          </div>

          <BlogRichEditor
            value={content}
            placeholder="Begin crafting your narrative journey. Focus on the rhythm of your words, and the space between them..."
            onChange={(html, text) => {
              setContent(html);
              setContentText(text);
            }}
            onEditorReady={setEditorInstance}
          />

          <div className="flex flex-wrap justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleSaveDraft}
              disabled={submitting || !hasDraftContent}
            >
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Draft
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setPreviewOpen(true)}
              disabled={!title.trim() && !content.trim()}
            >
              <Eye className="mr-2 h-4 w-4" />
              Preview
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isScheduled ? "Schedule Post" : "Publish"}
            </Button>
          </div>
        </div>

        <aside className="mt-8 space-y-5 lg:sticky lg:top-24 lg:mt-0 lg:pl-2">
          <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Publishing Settings
          </h3>
          <div className="space-y-2">
            <p className="text-sm font-medium">Topics</p>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <button
                    type="button"
                    className="flex w-full items-center justify-between rounded-lg border border-border/70 bg-background px-3 py-2 text-sm"
                  />
                }
              >
                <span className="truncate text-left">
                  {selectedTags.length ? `${selectedTags.length} selected` : "Select topics"}
                </span>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="max-h-80 w-64 overflow-y-auto">
                {COMMON_POST_TAGS.map((tag) => (
                  <DropdownMenuCheckboxItem
                    key={tag}
                    checked={selectedTags.includes(tag)}
                    onCheckedChange={() => toggleTag(tag)}
                  >
                    {tag}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            {selectedTags.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {selectedTags.map((tag) => (
                  <span key={tag} className="rounded-full bg-background px-2.5 py-1 text-xs text-muted-foreground">
                    #{tag}
                  </span>
                ))}
              </div>
            ) : null}
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Visibility</p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant={visibility === "PUBLIC" ? "default" : "outline"}
                onClick={() => setVisibility("PUBLIC")}
              >
                Public
              </Button>
              <Button
                type="button"
                size="sm"
                variant={visibility === "PRIVATE" ? "default" : "outline"}
                onClick={() => setVisibility("PRIVATE")}
              >
                Private
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Schedule</p>
            <input
              type="datetime-local"
              value={publishAt}
              onChange={(e) => setPublishAt(e.target.value)}
              className="w-full rounded-lg border border-border/70 bg-background px-3 py-2 text-sm outline-none"
            />
            <p className="text-xs text-muted-foreground">
              Leave empty to publish immediately.
            </p>
          </div>
        </aside>
      </form>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Post Preview</DialogTitle>
          </DialogHeader>
          {previewImage ? (
            <img
              src={previewImage}
              alt="Post preview"
              className="max-h-[24rem] w-full rounded-lg object-contain bg-muted/20"
            />
          ) : (
            <img
              src={generateTitlePreviewImage(title || "Untitled")}
              alt="Generated preview"
              className="max-h-[24rem] w-full rounded-lg object-contain bg-muted/20"
            />
          )}
          <h2 className="font-heading text-3xl font-bold">{title || "Untitled Post"}</h2>
          {selectedTags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {selectedTags.map((tag) => (
                <span key={tag} className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                  #{tag}
                </span>
              ))}
            </div>
          ) : null}
          <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
            {visibility === "PUBLIC" ? "Public post" : "Private post"}
          </p>
          <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
            {publishAt
              ? `Scheduled: ${new Date(publishAt).toLocaleString()}`
              : "Publish: Immediately"}
          </p>
          {contentText.trim() ? (
            <div
              className="prose prose-neutral dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{
                __html: sanitizeHtml(content, allowedHtmlConfig),
              }}
            />
          ) : (
            <div className="text-base leading-relaxed text-muted-foreground">No content yet.</div>
          )}
        </DialogContent>
      </Dialog>

      <FeaturedImageCropper
        open={cropOpen}
        source={pendingImageSrc}
        onCancel={() => {
          setCropOpen(false);
          setPendingImageSrc(null);
        }}
        onSave={handleCropSave}
      />
    </div>
  );
}
