import express from 'express';
import { getNotifications, markAllNotificationsAsRead, markNotificationAsRead } from '../controllers/notification.controller.js';
import {authMiddleware} from '../middlewares/auth.middleware.js';

const notificationRouter = express.Router();

notificationRouter.get('/getNotifications', authMiddleware, getNotifications);
notificationRouter.patch('/markAllRead', authMiddleware, markAllNotificationsAsRead);
notificationRouter.patch('/:id/read', authMiddleware, markNotificationAsRead);


export default notificationRouter;
