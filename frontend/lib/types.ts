export interface User {
  id: number;
  email: string;
  name: string;
  avatar?: string | null;
  bio?: string | null;
  socials?: SocialLinks;
}

export interface SocialLinks {
  twitter?: string;
  github?: string;
  linkedin?: string;
  website?: string;
  instagram?: string;
}

export interface UserProfile extends User {
  createdAt: string;
  socials: SocialLinks;
  counts: {
    posts: number;
    followers: number;
    following: number;
  };
  isFollowing: boolean;
}

export interface Post {
  id: number;
  title: string;
  content: string;
  previewImage?: string | null;
  category: string;
  tags: string[];
  status: "DRAFT" | "PUBLISHED";
  visibility: "PUBLIC" | "PRIVATE";
  publishAt: string;
  userid: number;
  createdAt: string;
  stats?: {
    likes: number;
    comments: number;
    saves: number;
  };
  likedByMe?: boolean;
  savedByMe?: boolean;
  recommendationReasons?: string[];
  user: {
    id: number;
    name: string;
    email: string;
    avatar?: string | null;
    trustFollowers?: Array<{
      id: number;
      name: string;
      email: string;
      avatar?: string | null;
    }>;
    followerCount?: number;
  };
}

export type ExploreSort = "latest" | "oldest" | "popular";

export interface Comment {
  id: number;
  content: string;
  postid: number;
  userid: number;
  parentid: number | null;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: number;
    name: string;
    email: string;
  };
}

export interface Like {
  id: number;
  postid: number;
  userid: number;
  createdAt: string;
}

export interface Follow {
  id: number;
  followerid: number;
  followingid: number;
  createdAt: string;
}

export interface Notification {
  id: number;
  type: "like" | "comment" | "follow" | "post";
  senderid: number;
  recieverid: number;
  postid: number | null;
  commentid: number | null;
  isRead: boolean;
  createdAt: string;
  sender: {
    id: number;
    name: string;
    email: string;
  };
  post?: {
    id: number;
    title: string;
    category?: string;
  };
  comment?: {
    id: number;
    content: string;
  };
}

export interface BookmarkItem {
  id: number;
  userid: number;
  listid: number;
  postid: number;
  createdAt: string;
  post: Post;
}

export interface BookmarkList {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
  count?: number;
  items?: BookmarkItem[];
}

export interface ReadHistoryItem {
  id: number;
  userid: number;
  postid: number;
  lastReadAt: string;
  createdAt: string;
  post: Post;
}

export interface AuthResponse {
  success?: boolean;
  message?: string;
  user?: User;
  error?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  page: number;
  data: T[];
}

export interface ExploreTopic {
  name: string;
  count: number;
}
