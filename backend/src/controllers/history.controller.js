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

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

function monthAgoDate() {
  return new Date(Date.now() - THIRTY_DAYS_MS);
}

async function cleanupOldHistory(userId) {
  await prisma.readHistory.deleteMany({
    where: {
      userid: userId,
      lastReadAt: {
        lt: monthAgoDate(),
      },
    },
  });
}

export const recordReadHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const postId = Number(req.params.postid);

    if (!Number.isInteger(postId) || postId <= 0) {
      return res.status(400).json({ success: false, message: "Invalid post id" });
    }

    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }

    await cleanupOldHistory(userId);

    const history = await prisma.readHistory.upsert({
      where: {
        userid_postid: {
          userid: userId,
          postid: postId,
        },
      },
      update: {
        lastReadAt: new Date(),
      },
      create: {
        userid: userId,
        postid: postId,
      },
    });

    return res.status(200).json({ success: true, data: history });
  } catch (error) {
    console.error("recordReadHistory failed", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const getMyReadHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    await cleanupOldHistory(userId);

    const entries = await prisma.readHistory.findMany({
      where: { userid: userId },
      orderBy: { lastReadAt: "desc" },
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
    });

    const normalizedEntries = entries.map((entry) => ({
      ...entry,
      post: normalizePostUserTrust(entry.post),
    }));

    return res.status(200).json({ success: true, data: normalizedEntries });
  } catch (error) {
    console.error("getMyReadHistory failed", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const clearMyReadHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    await prisma.readHistory.deleteMany({ where: { userid: userId } });
    return res.status(200).json({ success: true, message: "History cleared" });
  } catch (error) {
    console.error("clearMyReadHistory failed", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
