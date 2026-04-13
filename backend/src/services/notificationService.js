import { prisma } from "../lib/prisma.js";

export const createNotification = async ({
  type,
  senderid,
  recieverid,
  postid = null,
  commentid = null,
}) => {
  try {
    // for prevent self notification
    if (senderid === recieverid) return null;

    // 🔥 avoid duplicate like/post notifications
    if (type === "like" || type === "post") {
      const existing = await prisma.notification.findFirst({
        where: {
          type,
          senderid,
          recieverid,
          postid,
        },
      });

      if (existing) return existing;
    }

    const notification = await prisma.notification.create({
      data: {
        type,
        senderid,
        recieverid,
        postid,
        commentid,
      },
    });

    return notification;

  } catch (error) {
    console.error("Notification Service Error:", error);
    return null;
  }
};

export const notifyFollowersOfNewPost = async ({ senderid, postid }) => {
  try {
    const followers = await prisma.follow.findMany({
      where: {
        followingid: senderid,
      },
      select: {
        followerid: true,
      },
    });

    const recipientIds = followers
      .map((entry) => entry.followerid)
      .filter((id) => id !== senderid);

    if (recipientIds.length === 0) {
      return 0;
    }

    const existing = await prisma.notification.findMany({
      where: {
        type: "post",
        senderid,
        postid,
        recieverid: {
          in: recipientIds,
        },
      },
      select: {
        recieverid: true,
      },
    });

    const existingReceiverIds = new Set(existing.map((entry) => entry.recieverid));
    const rows = recipientIds
      .filter((id) => !existingReceiverIds.has(id))
      .map((recieverid) => ({
        type: "post",
        senderid,
        recieverid,
        postid,
        commentid: null,
      }));

    if (rows.length === 0) {
      return 0;
    }

    const result = await prisma.notification.createMany({
      data: rows,
    });

    return result.count;
  } catch (error) {
    console.error("notifyFollowersOfNewPost failed", error);
    return 0;
  }
};
