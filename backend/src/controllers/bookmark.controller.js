import { prisma } from "../lib/prisma.js";

function normalizePostUserTrust(post) {
  if (!post?.user) {
    return post;
  }

  const { following = [], _count, ...user } = post.user;
  const trustFollowers = following
    .map((entry) => entry?.follower)
    .filter(Boolean);

  return {
    ...post,
    user: {
      ...user,
      trustFollowers,
      followerCount: _count?.following ?? trustFollowers.length,
    },
  };
}

async function getOrCreateList({ userId, listId, listName }) {
  if (listId) {
    const existing = await prisma.bookmarkList.findUnique({
      where: { id: Number(listId) },
    });

    if (!existing || existing.userid !== userId) {
      throw new Error("Bookmark list not found");
    }

    return existing;
  }

  const normalizedName = typeof listName === "string" && listName.trim() ? listName.trim() : "Saved";

  const existingByName = await prisma.bookmarkList.findUnique({
    where: {
      userid_name: {
        userid: userId,
        name: normalizedName,
      },
    },
  });

  if (existingByName) {
    return existingByName;
  }

  return prisma.bookmarkList.create({
    data: {
      userid: userId,
      name: normalizedName,
    },
  });
}

export const getMyBookmarkLists = async (req, res) => {
  try {
    const userId = req.user.id;

    const lists = await prisma.bookmarkList.findMany({
      where: { userid: userId },
      include: {
        _count: {
          select: { items: true },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return res.status(200).json({
      success: true,
      data: lists.map((list) => ({
        id: list.id,
        name: list.name,
        createdAt: list.createdAt,
        updatedAt: list.updatedAt,
        count: list._count.items,
      })),
    });
  } catch (error) {
    console.error("getMyBookmarkLists failed", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const createBookmarkList = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name } = req.body;

    if (!name || !String(name).trim()) {
      return res.status(400).json({ success: false, message: "List name is required" });
    }

    const list = await prisma.bookmarkList.create({
      data: {
        userid: userId,
        name: String(name).trim(),
      },
    });

    return res.status(201).json({ success: true, data: list });
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(400).json({ success: false, message: "List name already exists" });
    }
    console.error("createBookmarkList failed", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const addBookmark = async (req, res) => {
  try {
    const userId = req.user.id;
    const { postid, listId, listName } = req.body;

    if (!postid) {
      return res.status(400).json({ success: false, message: "Post id is required" });
    }

    const post = await prisma.post.findUnique({ where: { id: Number(postid) } });
    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }

    const list = await getOrCreateList({ userId, listId, listName });

    const existing = await prisma.bookmarkItem.findUnique({
      where: {
        listid_postid: {
          listid: list.id,
          postid: Number(postid),
        },
      },
    });

    if (existing) {
      return res.status(200).json({ success: true, data: existing, message: "Already bookmarked" });
    }

    const bookmark = await prisma.bookmarkItem.create({
      data: {
        userid: userId,
        listid: list.id,
        postid: Number(postid),
      },
    });

    return res.status(201).json({ success: true, data: bookmark, list });
  } catch (error) {
    if (error.message === "Bookmark list not found") {
      return res.status(404).json({ success: false, message: error.message });
    }
    console.error("addBookmark failed", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const removeBookmark = async (req, res) => {
  try {
    const userId = req.user.id;
    const postId = Number(req.params.postid);
    const listId = req.query.listId ? Number(req.query.listId) : null;

    if (!postId) {
      return res.status(400).json({ success: false, message: "Invalid post id" });
    }

    if (listId) {
      const existing = await prisma.bookmarkItem.findFirst({
        where: { userid: userId, postid: postId, listid: listId },
      });

      if (!existing) {
        return res.status(404).json({ success: false, message: "Bookmark not found" });
      }

      await prisma.bookmarkItem.delete({ where: { id: existing.id } });
      return res.status(200).json({ success: true, message: "Bookmark removed" });
    }

    await prisma.bookmarkItem.deleteMany({ where: { userid: userId, postid: postId } });
    return res.status(200).json({ success: true, message: "Bookmark removed from all lists" });
  } catch (error) {
    console.error("removeBookmark failed", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const getMyBookmarkedBlogs = async (req, res) => {
  try {
    const userId = req.user.id;

    const lists = await prisma.bookmarkList.findMany({
      where: { userid: userId },
      orderBy: { updatedAt: "desc" },
      include: {
        items: {
          orderBy: { createdAt: "desc" },
          include: {
            post: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    avatar: true,
                    following: {
                      orderBy: { createdAt: "desc" },
                      take: 4,
                      select: {
                        follower: {
                          select: {
                            id: true,
                            name: true,
                            email: true,
                            avatar: true,
                          },
                        },
                      },
                    },
                    _count: {
                      select: { following: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    const normalizedLists = lists.map((list) => ({
      ...list,
      items: list.items.map((item) => ({
        ...item,
        post: normalizePostUserTrust(item.post),
      })),
    }));

    return res.status(200).json({ success: true, data: normalizedLists });
  } catch (error) {
    console.error("getMyBookmarkedBlogs failed", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const getPostBookmarkStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const postId = Number(req.params.postid);

    const entries = await prisma.bookmarkItem.findMany({
      where: { userid: userId, postid: postId },
      include: {
        list: true,
      },
    });

    return res.status(200).json({
      success: true,
      data: {
        isBookmarked: entries.length > 0,
        lists: entries.map((entry) => ({
          id: entry.list.id,
          name: entry.list.name,
        })),
      },
    });
  } catch (error) {
    console.error("getPostBookmarkStatus failed", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
