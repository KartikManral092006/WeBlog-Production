import { prisma } from "../lib/prisma.js";

function normalizeSocials(rawSocials = {}) {
  const allowedKeys = ["twitter", "github", "linkedin", "website", "instagram"];
  const normalized = {};

  for (const key of allowedKeys) {
    const value = rawSocials?.[key];
    if (typeof value === "string" && value.trim()) {
      normalized[key] = value.trim();
    }
  }

  return normalized;
}

export const getUserProfile = async (req, res) => {
  try {
    const userId = Number(req.params.id);

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid user id",
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        bio: true,
        socials: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const [postsCount, followersCount, followingCount] = await Promise.all([
      prisma.post.count({ where: { userid: userId } }),
      prisma.follow.count({ where: { followingid: userId } }),
      prisma.follow.count({ where: { followerid: userId } }),
    ]);

    let isFollowing = false;
    if (req.user?.id && req.user.id !== userId) {
      const follow = await prisma.follow.findUnique({
        where: {
          followerid_followingid: {
            followerid: req.user.id,
            followingid: userId,
          },
        },
      });
      isFollowing = Boolean(follow);
    }

    return res.status(200).json({
      success: true,
      data: {
        ...user,
        socials: user.socials || {},
        counts: {
          posts: postsCount,
          followers: followersCount,
          following: followingCount,
        },
        isFollowing,
      },
    });
  } catch (error) {
    console.error("getUserProfile failed", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const updateMyProfile = async (req, res) => {
  try {
    const { name, avatar, bio, socials } = req.body;

    const payload = {};

    if (typeof name === "string") {
      const trimmedName = name.trim();
      if (!trimmedName) {
        return res.status(400).json({
          success: false,
          message: "Name cannot be empty",
        });
      }
      payload.name = trimmedName;
    }

    if (avatar !== undefined) {
      if (avatar !== null && typeof avatar !== "string") {
        return res.status(400).json({
          success: false,
          message: "Avatar must be a string URL",
        });
      }
      payload.avatar = avatar && avatar.trim() ? avatar.trim() : null;
    }

    if (bio !== undefined) {
      if (bio !== null && typeof bio !== "string") {
        return res.status(400).json({
          success: false,
          message: "Bio must be text",
        });
      }
      payload.bio = bio && bio.trim() ? bio.trim() : null;
    }

    if (socials !== undefined) {
      if (socials === null) {
        payload.socials = {};
      } else if (typeof socials === "object") {
        payload.socials = normalizeSocials(socials);
      } else {
        return res.status(400).json({
          success: false,
          message: "Social links must be an object",
        });
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: payload,
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        bio: true,
        socials: true,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: {
        ...updatedUser,
        socials: updatedUser.socials || {},
      },
    });
  } catch (error) {
    console.error("updateMyProfile failed", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
