import express from 'express'

const commentRouter = express.Router()

import { createComment, getCommentsByPostId, deleteComment } from '../controllers/comment.controller.js'
import { authMiddleware } from '../middlewares/auth.middleware.js'

commentRouter.post('/createComment', authMiddleware, createComment)
commentRouter.get('/:postid', getCommentsByPostId)
commentRouter.delete('/:commentid', authMiddleware, deleteComment)

export default commentRouter
