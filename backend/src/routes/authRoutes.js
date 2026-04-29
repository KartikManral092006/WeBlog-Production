import express from 'express';
import { register, login, logout, googleAuth, googleCallback } from "../controllers/auth.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const authRoute = express.Router();

authRoute.post('/register', register);
authRoute.post('/login', login);
authRoute.post('/logout', logout);
authRoute.get('/google', googleAuth);
authRoute.get('/google/callback', googleCallback);
authRoute.get('/me', authMiddleware, (req, res) => {
  res.status(200).json({ success: true, data: req.user });
});

export default authRoute;
