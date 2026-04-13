import { prisma } from "../lib/prisma.js";

export const getNotifications = async (req, res) => {
    try {
        const userId = req.user.id;

        // Keep notification table clean: remove items older than 30 days for this user.
        const cutoffDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        await prisma.notification.deleteMany({
            where: {
                recieverid: userId,
                createdAt: {
                    lt: cutoffDate,
                },
            },
        });

        const notifications = await prisma.notification.findMany({
            where: {
                recieverid: userId,
            },
            orderBy: {
                createdAt: "desc",
            },
            include: {
                sender: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                post: {
                    select: {
                        id: true,
                        title: true,
                        category: true,
                    },
                },
                comment: {
                    select: {
                        id: true,
                        content: true,
                    },
                },
            },
        });

        res.status(200).json({
            success: true,
            data: notifications,
        });

    } catch (error) {
        console.error("getNotifications failed ", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
}

export const markAllNotificationsAsRead = async (req, res) => {
    try {
        const userId = req.user.id;

        const result = await prisma.notification.updateMany({
            where: {
                recieverid: userId,
                isRead: false,
            },
            data: {
                isRead: true,
            },
        });

        return res.status(200).json({
            success: true,
            updatedCount: result.count,
        });
    } catch (error) {
        console.error("markAllNotificationsAsRead failed", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};

export const markNotificationAsRead = async (req, res) => {
    try {
        const userId = req.user.id;
        const notificationId = parseInt(req.params.id, 10);

        if (Number.isNaN(notificationId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid notification id",
            });
        }

        const existing = await prisma.notification.findFirst({
            where: {
                id: notificationId,
                recieverid: userId,
            },
            select: {
                id: true,
                isRead: true,
            },
        });

        if (!existing) {
            return res.status(404).json({
                success: false,
                message: "Notification not found",
            });
        }

        if (existing.isRead) {
            return res.status(200).json({
                success: true,
                updatedCount: 0,
            });
        }

        await prisma.notification.update({
            where: {
                id: notificationId,
            },
            data: {
                isRead: true,
            },
        });

        return res.status(200).json({
            success: true,
            updatedCount: 1,
        });
    } catch (error) {
        console.error("markNotificationAsRead failed", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};
