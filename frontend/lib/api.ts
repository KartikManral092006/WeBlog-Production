import type {
  AuthResponse,
  Post,
  Comment,
  Like,
  Follow,
  Notification,
  PaginatedResponse,
  User,
  UserProfile,
  SocialLinks,
  BookmarkList,
  ReadHistoryItem,
  ExploreTopic,
  ExploreSort,
} from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_PATH || "/api/v1";

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });

  const contentType = res.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? await res.json()
    : await res.text();

  if (!res.ok) {
    if (typeof data === "string") {
      throw new Error(data || "Something went wrong");
    }
    throw new Error(data.message || data.error || "Something went wrong");
  }

  return data as T;
}

// Auth API
export const authAPI = {
  register: (name: string, email: string, password: string) =>
    request<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ username: name, email, password }),
    }),

  login: (email: string, password: string, rememberMe = false) =>
    request<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password, rememberMe }),
    }),

  logout: () =>
    request<AuthResponse>("/auth/logout", { method: "POST" }),

  me: () => request<{ success: boolean; data: User }>("/auth/me"),
};

// Blog API
export const blogAPI = {
  getAll: (page = 1) =>
    request<PaginatedResponse<Post>>(`/blogs/all?page=${page}`),

  getTopics: () =>
    request<{ success: boolean; data: ExploreTopic[] }>(`/blogs/topics`),

  explore: (page = 1, query = "", topic = "All", sort: ExploreSort = "latest") => {
    const qs = new URLSearchParams({
      page: String(page),
      query,
      topic,
      sort,
    });
    return request<PaginatedResponse<Post>>(`/blogs/explore?${qs.toString()}`);
  },

  forYou: (page = 1, query = "") => {
    const qs = new URLSearchParams({
      page: String(page),
      query,
    });
    return request<PaginatedResponse<Post>>(`/blogs/for-you?${qs.toString()}`);
  },

  getById: (id: number) =>
    request<{ success: boolean; data: Post }>(`/blogs/${id}`),

  getScheduledMine: () =>
    request<{ success: boolean; data: Post[] }>(`/blogs/scheduled/my`),

  getDraftsMine: () =>
    request<{ success: boolean; data: Post[] }>(`/blogs/drafts/my`),

  create: (
    title: string,
    content: string,
    previewImage?: string | null,
    tags?: string[],
    visibility?: "PUBLIC" | "PRIVATE",
    publishAt?: string | null,
    status?: "DRAFT" | "PUBLISHED"
  ) =>
    request<{ success: boolean; data: Post }>("/blogs/create", {
      method: "POST",
      body: JSON.stringify({ title, content, previewImage, tags, visibility, publishAt, status }),
    }),

  update: (
    id: number,
    title: string,
    content: string,
    previewImage?: string | null,
    tags?: string[],
    visibility?: "PUBLIC" | "PRIVATE",
    publishAt?: string | null,
    status?: "DRAFT" | "PUBLISHED"
  ) =>
    request<{ success: boolean; data: Post }>(`/blogs/${id}`, {
      method: "PUT",
      body: JSON.stringify({ title, content, previewImage, tags, visibility, publishAt, status }),
    }),

  delete: (id: number) =>
    request<{ success: boolean; message: string }>(`/blogs/${id}`, {
      method: "DELETE",
    }),
};

// Comment API
export const commentAPI = {
  create: (postid: number, content: string) =>
    request<{ success: boolean; data: Comment }>("/comments/createComment", {
      method: "POST",
      body: JSON.stringify({ postid, content }),
    }),

  getByPostId: (postid: number) =>
    request<{ success: boolean; data: Comment[] }>(`/comments/${postid}`),

  delete: (commentid: number) =>
    request<{ success: boolean; message: string }>(`/comments/${commentid}`, {
      method: "DELETE",
    }),
};

// Like API
export const likeAPI = {
  like: (postid: number) =>
    request<{ success: boolean; data: Like }>(`/likes/like/${postid}`, {
      method: "POST",
    }),

  unlike: (postid: number) =>
    request<{ success: boolean; message: string }>(`/likes/unlike/${postid}`, {
      method: "DELETE",
    }),
};

// Follow API
export const followAPI = {
  follow: (userid: number) =>
    request<{ success: boolean; data: Follow }>(`/follow/follow/${userid}`, {
      method: "POST",
    }),

  unfollow: (userid: number) =>
    request<{ success: boolean; message: string }>(
      `/follow/unfollow/${userid}`,
      { method: "DELETE" }
    ),
};

// Notification API
export const notificationAPI = {
  getAll: () =>
    request<{ success: boolean; data: Notification[] }>(
      "/notifications/getNotifications"
    ),
  markAllRead: () =>
    request<{ success: boolean; updatedCount: number }>(
      "/notifications/markAllRead",
      { method: "PATCH" }
    ),
  markOneRead: (id: number) =>
    request<{ success: boolean; updatedCount: number }>(
      `/notifications/${id}/read`,
      { method: "PATCH" }
    ),
};

// User Profile API
export const userAPI = {
  getById: (id: number) =>
    request<{ success: boolean; data: UserProfile }>(`/users/${id}`),

  updateMe: (payload: {
    name?: string;
    avatar?: string | null;
    bio?: string | null;
    socials?: SocialLinks;
  }) =>
    request<{ success: boolean; message: string; data: User }>("/users/me", {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
};

// Bookmark API
export const bookmarkAPI = {
  getLists: () =>
    request<{ success: boolean; data: BookmarkList[] }>("/bookmarks/lists"),

  createList: (name: string) =>
    request<{ success: boolean; data: BookmarkList }>("/bookmarks/lists", {
      method: "POST",
      body: JSON.stringify({ name }),
    }),

  getAll: () =>
    request<{ success: boolean; data: BookmarkList[] }>("/bookmarks/all"),

  getPostStatus: (postid: number) =>
    request<{
      success: boolean;
      data: { isBookmarked: boolean; lists: Array<{ id: number; name: string }> };
    }>(`/bookmarks/status/${postid}`),

  add: (postid: number, listId?: number, listName?: string) =>
    request<{ success: boolean; message?: string }>("/bookmarks/add", {
      method: "POST",
      body: JSON.stringify({ postid, listId, listName }),
    }),

  remove: (postid: number, listId?: number) =>
    request<{ success: boolean; message: string }>(
      `/bookmarks/remove/${postid}${listId ? `?listId=${listId}` : ""}`,
      { method: "DELETE" }
    ),
};

// Read History API
export const historyAPI = {
  recordRead: (postid: number) =>
    request<{ success: boolean }>(`/history/read/${postid}`, {
      method: "POST",
    }),

  getMyHistory: () =>
    request<{ success: boolean; data: ReadHistoryItem[] }>("/history/my"),

  clearMyHistory: () =>
    request<{ success: boolean; message: string }>("/history/my", {
      method: "DELETE",
    }),
};
