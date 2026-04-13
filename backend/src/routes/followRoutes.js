import express from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { followUser, unfollowUser } from '../controllers/follow.controller.js';



const followRouter = express.Router();

followRouter.post('/follow/:userid', authMiddleware, followUser);
followRouter.delete('/unfollow/:userid', authMiddleware, unfollowUser);

export default followRouter;
