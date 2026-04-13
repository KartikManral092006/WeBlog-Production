import express from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import {
  addBookmark,
  createBookmarkList,
  getMyBookmarkedBlogs,
  getMyBookmarkLists,
  getPostBookmarkStatus,
  removeBookmark,
} from "../controllers/bookmark.controller.js";

const bookmarkRouter = express.Router();

bookmarkRouter.get("/lists", authMiddleware, getMyBookmarkLists);
bookmarkRouter.post("/lists", authMiddleware, createBookmarkList);
bookmarkRouter.get("/all", authMiddleware, getMyBookmarkedBlogs);
bookmarkRouter.get("/status/:postid", authMiddleware, getPostBookmarkStatus);
bookmarkRouter.post("/add", authMiddleware, addBookmark);
bookmarkRouter.delete("/remove/:postid", authMiddleware, removeBookmark);

export default bookmarkRouter;
