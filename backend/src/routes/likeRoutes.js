import express from 'express'
import { authMiddleware } from '../middlewares/auth.middleware.js'
import {likePost , unlikePost } from "../controllers/like.controller.js"


const likeRouter = express.Router()

// like routes
likeRouter.post("/like/:postid", authMiddleware, likePost)
likeRouter.delete("/unlike/:postid", authMiddleware, unlikePost)

export default likeRouter ;
