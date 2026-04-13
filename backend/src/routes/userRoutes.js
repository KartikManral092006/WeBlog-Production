import express from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { getUserProfile, updateMyProfile } from "../controllers/user.controller.js";

const userRouter = express.Router();

userRouter.put("/me", authMiddleware, updateMyProfile);
userRouter.get("/:id", getUserProfile);

export default userRouter;
