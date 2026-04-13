"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  UserRound,
  Globe,
  Save,
  Eye,
  Upload,
  Move,
  ZoomIn,
} from "lucide-react";
import { motion } from "motion/react";
import { useAuth } from "@/context/auth-context";
import { blogAPI, userAPI } from "@/lib/api";
import type { Post, UserProfile } from "@/lib/types";
import { BlogCard } from "@/components/blog-card";
import { FollowButton } from "@/components/follow-button";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

function SocialIcon({ platform }: { platform: "github" | "linkedin" | "twitter" | "instagram" }) {
  if (platform === "github") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden className="h-4 w-4" fill="currentColor">
        <path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34a2.65 2.65 0 0 0-1.11-1.47c-.9-.62.07-.6.07-.6a2.1 2.1 0 0 1 1.53 1.03 2.13 2.13 0 0 0 2.91.83 2.14 2.14 0 0 1 .64-1.34c-2.22-.25-4.56-1.11-4.56-4.93a3.86 3.86 0 0 1 1.03-2.68 3.58 3.58 0 0 1 .1-2.64s.84-.27 2.75 1.02a9.5 9.5 0 0 1 5 0c1.9-1.3 2.75-1.02 2.75-1.02a3.58 3.58 0 0 1 .1 2.64 3.85 3.85 0 0 1 1.02 2.68c0 3.83-2.34 4.67-4.57 4.92a2.4 2.4 0 0 1 .68 1.86v2.76c0 .27.18.58.69.48A10 10 0 0 0 12 2Z" />
      </svg>
    );
  }

  if (platform === "linkedin") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden className="h-4 w-4" fill="currentColor">
        <path d="M6.94 8.5a1.56 1.56 0 1 1 0-3.12 1.56 1.56 0 0 1 0 3.12ZM5.58 18.5h2.72v-8.2H5.58v8.2Zm4.24 0h2.72v-4.2c0-1.12.22-2.2 1.6-2.2 1.36 0 1.38 1.27 1.38 2.27v4.13h2.72v-4.67c0-2.3-.49-4.06-3.17-4.06-1.28 0-2.14.7-2.5 1.37h-.04V10.3H9.82c.03.54 0 8.2 0 8.2Z" />
      </svg>
    );
  }

  if (platform === "twitter") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden className="h-4 w-4" fill="currentColor">
        <path d="M3 3h4.64l4.31 6.15L17.46 3H21l-7.2 8.18L21.5 21h-4.64l-4.75-6.77L6.1 21H2.56l7.54-8.58L3 3Zm5.6 2.48H7.2l8.2 13.04h1.4L8.6 5.48Z" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden className="h-4 w-4" fill="currentColor">
      <path d="M7.75 2h8.5A5.75 5.75 0 0 1 22 7.75v8.5A5.75 5.75 0 0 1 16.25 22h-8.5A5.75 5.75 0 0 1 2 16.25v-8.5A5.75 5.75 0 0 1 7.75 2Zm8.43 1.72a4.03 4.03 0 0 0-4.03 4.03v8.5a4.03 4.03 0 0 0 4.03 4.03h-8.5a4.03 4.03 0 0 0 4.03-4.03v-8.5a4.03 4.03 0 0 0-4.03-4.03h8.5ZM18.2 6.2a1.1 1.1 0 1 0 0 2.2 1.1 1.1 0 0 0 0-2.2ZM12 8.3A3.7 3.7 0 1 1 8.3 12 3.7 3.7 0 0 1 12 8.3Zm0 1.72A1.98 1.98 0 1 0 13.98 12 1.98 1.98 0 0 0 12 10.02Z" />
    </svg>
  );
}

export default function ProfilePage() {
  const params = useParams();
  const { user, updateProfile } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [viewAvatarOpen, setViewAvatarOpen] = useState(false);
  const [cropAvatarOpen, setCropAvatarOpen] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [pendingAvatarSrc, setPendingAvatarSrc] = useState<string | null>(null);
  const [cropX, setCropX] = useState(0);
  const [cropY, setCropY] = useState(0);
  const [cropZoom, setCropZoom] = useState(1);
  const avatarFileInputRef = useRef<HTMLInputElement | null>(null);

  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("");
  const [bio, setBio] = useState("");
  const [twitter, setTwitter] = useState("");
  const [github, setGithub] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [website, setWebsite] = useState("");
  const [instagram, setInstagram] = useState("");

  const profileId = Number(params.id);
  const isOwner = user?.id === profileId;

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [profileRes, ...postResponses] = await Promise.all([
          userAPI.getById(profileId),
          blogAPI.getAll(1),
          blogAPI.getAll(2),
          blogAPI.getAll(3),
        ]);

        setProfile(profileRes.data);
        setName(profileRes.data.name || "");
        setAvatar(profileRes.data.avatar || "");
        setBio(profileRes.data.bio || "");
        setTwitter(profileRes.data.socials?.twitter || "");
        setGithub(profileRes.data.socials?.github || "");
        setLinkedin(profileRes.data.socials?.linkedin || "");
        setWebsite(profileRes.data.socials?.website || "");
        setInstagram(profileRes.data.socials?.instagram || "");

        const allPosts = postResponses.flatMap((response) => response.data);
        const filtered = allPosts.filter((post) => post.userid === profileId);
        setPosts(filtered);
      } catch {
        setProfile(null);
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };

    if (Number.isFinite(profileId) && profileId > 0) {
      void loadData();
      return;
    }

    setLoading(false);
    setProfile(null);
    setPosts([]);
  }, [profileId]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isOwner) {
      return;
    }

    setSaving(true);
    try {
      await updateProfile({
        name,
        avatar: avatar.trim() || null,
        bio: bio.trim() || null,
        socials: {
          twitter: twitter.trim() || undefined,
          github: github.trim() || undefined,
          linkedin: linkedin.trim() || undefined,
          website: website.trim() || undefined,
          instagram: instagram.trim() || undefined,
        },
      });

      const refreshed = await userAPI.getById(profileId);
      setProfile(refreshed.data);
      toast.success("Profile updated successfully");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleUploadAvatarClick = () => {
    if (!isOwner) {
      toast.error("You can only update your own profile picture");
      return;
    }
    avatarFileInputRef.current?.click();
  };

  const handleAvatarFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      toast.error("Image size must be under 3MB");
      return;
    }

    const readAsDataUrl = () =>
      new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ""));
        reader.onerror = () => reject(new Error("Failed to read selected image"));
        reader.readAsDataURL(file);
      });

    try {
      const avatarDataUrl = await readAsDataUrl();
      setPendingAvatarSrc(avatarDataUrl);
      setCropX(0);
      setCropY(0);
      setCropZoom(1);
      setCropAvatarOpen(true);
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Failed to prepare image for cropping"
      );
    }
  };

  const handleUploadCroppedAvatar = async () => {
    if (!pendingAvatarSrc) {
      return;
    }

    const createCroppedAvatar = () =>
      new Promise<string>((resolve, reject) => {
        const image = new Image();
        image.onload = () => {
          try {
            const cropSize = 320;
            const outputSize = 512;
            const scaleFactor = outputSize / cropSize;

            const canvas = document.createElement("canvas");
            canvas.width = outputSize;
            canvas.height = outputSize;

            const ctx = canvas.getContext("2d");
            if (!ctx) {
              reject(new Error("Unable to initialize image cropper"));
              return;
            }

            const baseScale = Math.min(cropSize / image.width, cropSize / image.height);
            const finalScale = baseScale * cropZoom;
            const drawWidth = image.width * finalScale * scaleFactor;
            const drawHeight = image.height * finalScale * scaleFactor;

            const centerX = (cropSize / 2 + cropX) * scaleFactor;
            const centerY = (cropSize / 2 + cropY) * scaleFactor;

            const drawX = centerX - drawWidth / 2;
            const drawY = centerY - drawHeight / 2;

            ctx.clearRect(0, 0, outputSize, outputSize);
            ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight);

            resolve(canvas.toDataURL("image/jpeg", 0.92));
          } catch {
            reject(new Error("Failed to crop selected image"));
          }
        };
        image.onerror = () => reject(new Error("Failed to load selected image"));
        image.src = pendingAvatarSrc;
      });

    setUploadingAvatar(true);
    try {
      const avatarDataUrl = await createCroppedAvatar();
      await updateProfile({ avatar: avatarDataUrl });

      setAvatar(avatarDataUrl);
      const refreshed = await userAPI.getById(profileId);
      setProfile(refreshed.data);
      setCropAvatarOpen(false);
      setPendingAvatarSrc(null);
      toast.success("Profile picture updated");
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Failed to upload profile picture"
      );
    } finally {
      setUploadingAvatar(false);
    }
  };

  const profileName = useMemo(() => {
    if (profile?.name) return profile.name;
    if (user?.id === profileId) return user.name;
    return `User ${profileId}`;
  }, [profile, profileId, user]);

  const socials = profile?.socials || {};

  if (!Number.isFinite(profileId) || profileId <= 0) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-16 text-center">
        <h2 className="mb-2 text-2xl font-bold">Invalid profile</h2>
        <p className="mb-4 text-muted-foreground">
          The requested profile id is invalid.
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

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <Link href="/">
        <Button variant="ghost" size="sm" className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </Link>

      <section className="mb-10 border-b border-border/70 pb-8">
        <div className="grid gap-6 md:grid-cols-[220px_1fr] md:items-start">
          <div>
            {isOwner ? (
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <button
                      type="button"
                      className="block w-full overflow-hidden rounded-sm border border-border/70 bg-muted transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={uploadingAvatar}
                      aria-label="Profile picture options"
                    />
                  }
                >
                  {profile?.avatar ? (
                    <img
                      src={profile.avatar}
                      alt={profileName}
                      className="h-75 w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-75 items-center justify-center bg-muted text-7xl font-semibold text-muted-foreground">
                      {profileName.charAt(0).toUpperCase() || <UserRound className="h-10 w-10" />}
                    </div>
                  )}
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-64 rounded-xl p-2">
                  <DropdownMenuItem onClick={() => setViewAvatarOpen(true)} className="rounded-lg px-3 py-2.5">
                    <Eye className="mr-2 h-4 w-4" />
                    View profile picture
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleUploadAvatarClick} className="rounded-lg px-3 py-2.5">
                    <Upload className="mr-2 h-4 w-4" />
                    {uploadingAvatar ? "Uploading..." : "Upload new profile picture"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : profile?.avatar ? (
              <img
                src={profile.avatar}
                alt={profileName}
                className="h-75 w-full rounded-sm border border-border/70 object-cover"
              />
            ) : (
              <div className="flex h-75 items-center justify-center rounded-sm border border-border/70 bg-muted text-7xl font-semibold text-muted-foreground">
                {profileName.charAt(0).toUpperCase() || <UserRound className="h-10 w-10" />}
              </div>
            )}

            <input
              ref={avatarFileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarFileChange}
            />
          </div>

          <div>
            <h1 className="font-heading mt-1 text-5xl leading-none md:text-6xl">{profileName}</h1>
            {profile?.bio ? (
              <p className="mt-3 max-w-3xl text-lg italic leading-relaxed text-muted-foreground">
                {profile.bio}
              </p>
            ) : null}

            <div className="mt-6 grid grid-cols-3 gap-4 border-y border-border/70 py-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Essays</p>
                <p className="mt-1 text-3xl font-semibold">{profile?.counts.posts || 0}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Followers</p>
                <p className="mt-1 text-3xl font-semibold">{profile?.counts.followers || 0}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Following</p>
                <p className="mt-1 text-3xl font-semibold">{profile?.counts.following || 0}</p>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              {isOwner ? (
                <Button
                  type="button"
                  onClick={() => {
                    document.getElementById("edit-profile")?.scrollIntoView({ behavior: "smooth" });
                  }}
                >
                  Edit Profile
                </Button>
              ) : (
                <FollowButton targetUserId={profileId} />
              )}

              {socials.website && (
                <a href={socials.website} target="_blank" rel="noreferrer" aria-label="Website" title="Website">
                  <Button variant="outline" size="icon" className="rounded-full">
                    <Globe className="h-4 w-4" />
                  </Button>
                </a>
              )}
              {socials.github && (
                <a href={socials.github} target="_blank" rel="noreferrer" aria-label="GitHub" title="GitHub">
                  <Button variant="outline" size="icon" className="rounded-full">
                    <SocialIcon platform="github" />
                  </Button>
                </a>
              )}
              {socials.linkedin && (
                <a href={socials.linkedin} target="_blank" rel="noreferrer" aria-label="LinkedIn" title="LinkedIn">
                  <Button variant="outline" size="icon" className="rounded-full">
                    <SocialIcon platform="linkedin" />
                  </Button>
                </a>
              )}
              {socials.twitter && (
                <a href={socials.twitter} target="_blank" rel="noreferrer" aria-label="Twitter" title="Twitter">
                  <Button variant="outline" size="icon" className="rounded-full">
                    <SocialIcon platform="twitter" />
                  </Button>
                </a>
              )}
              {socials.instagram && (
                <a href={socials.instagram} target="_blank" rel="noreferrer" aria-label="Instagram" title="Instagram">
                  <Button variant="outline" size="icon" className="rounded-full">
                    <SocialIcon platform="instagram" />
                  </Button>
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      <Dialog open={viewAvatarOpen} onOpenChange={setViewAvatarOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Profile Picture</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-2">
            {profile?.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatar}
                alt={`${profileName} profile picture`}
                className="max-h-[65vh] w-auto rounded-xl border object-contain"
              />
            ) : (
              <div className="flex h-56 w-56 items-center justify-center rounded-full border bg-muted text-6xl font-semibold text-muted-foreground">
                {profileName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={cropAvatarOpen} onOpenChange={setCropAvatarOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Adjust Profile Picture</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="relative h-80 w-80 overflow-hidden rounded-full border-4 border-white bg-muted shadow-inner dark:border-zinc-700">
                {pendingAvatarSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={pendingAvatarSrc}
                    alt="Crop preview"
                    className="absolute left-1/2 top-1/2 h-full w-full max-w-none object-contain"
                    style={{
                      transform: `translate(calc(-50% + ${cropX}px), calc(-50% + ${cropY}px)) scale(${cropZoom})`,
                    }}
                  />
                ) : null}
              </div>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="flex items-center gap-2 text-sm">
                  <ZoomIn className="h-4 w-4" />
                  Zoom
                </Label>
                <input
                  type="range"
                  min={0.6}
                  max={3}
                  step={0.01}
                  value={cropZoom}
                  onChange={(e) => setCropZoom(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              <div className="space-y-1">
                <Label className="flex items-center gap-2 text-sm">
                  <Move className="h-4 w-4" />
                  Horizontal Position
                </Label>
                <input
                  type="range"
                  min={-120}
                  max={120}
                  step={1}
                  value={cropX}
                  onChange={(e) => setCropX(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-sm">Vertical Position</Label>
                <input
                  type="range"
                  min={-120}
                  max={120}
                  step={1}
                  value={cropY}
                  onChange={(e) => setCropY(Number(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setCropAvatarOpen(false);
                  setPendingAvatarSrc(null);
                }}
                disabled={uploadingAvatar}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleUploadCroppedAvatar}
                disabled={uploadingAvatar || !pendingAvatarSrc}
              >
                {uploadingAvatar ? "Uploading..." : "Save & Upload"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {isOwner && (
        <motion.section
          id="edit-profile"
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          className="relative mb-8 overflow-hidden rounded-2xl bg-background/20 p-6 shadow-none backdrop-blur-sm md:p-7"
        >
          <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-linear-to-b from-primary/6 to-transparent" />
          <div className="relative z-10">
            <div className="mb-5 flex items-center justify-between gap-3">
              <h2 className="font-heading text-3xl leading-none">Edit Profile</h2>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-5">
              <motion.div initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.05, duration: 0.35 }} className="space-y-2">
                <Label htmlFor="name" className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">Display Name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="h-11 rounded-xl border-border/70 bg-background/75" />
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1, duration: 0.35 }} className="space-y-2">
                <Label htmlFor="avatar" className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">Avatar URL</Label>
                <Input
                  id="avatar"
                  placeholder="https://example.com/avatar.jpg"
                  value={avatar}
                  onChange={(e) => setAvatar(e.target.value)}
                  className="h-11 rounded-xl border-border/70 bg-background/75"
                />
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.14, duration: 0.35 }} className="space-y-2">
                <Label htmlFor="bio" className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">About</Label>
                <Textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={4}
                  placeholder="Tell people about you..."
                  className="rounded-xl border-border/70 bg-background/75"
                />
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.18, duration: 0.35 }} className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="website" className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">Website</Label>
                  <Input
                    id="website"
                    placeholder="https://yourwebsite.com"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    className="h-11 rounded-xl border-border/70 bg-background/75"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="github" className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">GitHub</Label>
                  <Input
                    id="github"
                    placeholder="https://github.com/username"
                    value={github}
                    onChange={(e) => setGithub(e.target.value)}
                    className="h-11 rounded-xl border-border/70 bg-background/75"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="linkedin" className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">LinkedIn</Label>
                  <Input
                    id="linkedin"
                    placeholder="https://linkedin.com/in/username"
                    value={linkedin}
                    onChange={(e) => setLinkedin(e.target.value)}
                    className="h-11 rounded-xl border-border/70 bg-background/75"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="twitter" className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">Twitter</Label>
                  <Input
                    id="twitter"
                    placeholder="https://x.com/username"
                    value={twitter}
                    onChange={(e) => setTwitter(e.target.value)}
                    className="h-11 rounded-xl border-border/70 bg-background/75"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="instagram" className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">Instagram</Label>
                  <Input
                    id="instagram"
                    placeholder="https://instagram.com/username"
                    value={instagram}
                    onChange={(e) => setInstagram(e.target.value)}
                    className="h-11 rounded-xl border-border/70 bg-background/75"
                  />
                </div>
              </motion.div>

              <div className="flex justify-end">
                <Button type="submit" disabled={saving} className="rounded-full px-6">
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? "Saving..." : "Save Profile"}
                </Button>
              </div>
            </form>
          </div>
        </motion.section>
      )}

      <section>
        <h2 className="mb-4 text-xl font-semibold">Posts</h2>

        {loading ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="space-y-3 rounded-lg border p-6">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="rounded-lg border py-14 text-center">
            <p className="text-muted-foreground">No posts published yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <BlogCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
