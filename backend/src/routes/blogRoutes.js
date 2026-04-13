import express from 'express';
import {
	createBlog,
	getAllBlogs,
	getBlogById,
	updateBlog,
	deleteBlog,
	getExploreTopics,
	searchExploreBlogs,
	getForYouBlogs,
	getMyScheduledBlogs,
	getMyDraftBlogs,
} from "../controllers/blog.controller.js";
import { authMiddleware, optionalAuthMiddleware } from "../middlewares/auth.middleware.js";

const blogRoute = express.Router();

blogRoute.post('/create',authMiddleware, createBlog);

blogRoute.get('/all', optionalAuthMiddleware, getAllBlogs);

blogRoute.get('/topics', getExploreTopics);

blogRoute.get('/explore', optionalAuthMiddleware, searchExploreBlogs);

blogRoute.get('/for-you', optionalAuthMiddleware, getForYouBlogs);

blogRoute.get('/scheduled/my', authMiddleware, getMyScheduledBlogs);

blogRoute.get('/drafts/my', authMiddleware, getMyDraftBlogs);

blogRoute.get('/:id', optionalAuthMiddleware, getBlogById);

blogRoute.put('/:id', authMiddleware, updateBlog);

blogRoute.delete('/:id', authMiddleware,deleteBlog);

export default blogRoute;
