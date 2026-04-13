import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";

import authRoute from "./routes/authRoutes.js";
import blogRoute from "./routes/blogRoutes.js";
import commentRouter from "./routes/commentRoutes.js";
import likeRouter from "./routes/likeRoutes.js";
import followRouter from "./routes/followRoutes.js";
import notificationRouter from "./routes/notificationRoutes.js";
import userRouter from "./routes/userRoutes.js";
import bookmarkRouter from "./routes/bookmarkRoutes.js";
import historyRouter from "./routes/historyRoutes.js";

import { prisma } from "./lib/prisma.js";

dotenv.config();

const app = express();

const allowedOrigins = [
  process.env.FRONTEND_URL,
  "http://localhost:3000",
  "http://localhost:5173",
].filter(Boolean);

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));

app.use(express.json({ limit: "8mb" }));
app.use(express.urlencoded({ extended: true, limit: "8mb" }));
app.use(cookieParser());

if (process.env.NODE_ENV !== "production") {
  app.get("/test-db", async (req, res) => {
    try {
      const result = await prisma.$queryRaw`SELECT NOW()`;
      res.json({
        success: true,
        data: result,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({
        success: false,
        error: err.message,
      });
    }
  });
}

app.get("/", (req, res) => {
  res.send("Welcome To WeBlog");
});

app.use("/api/v1/auth", authRoute);
app.use("/api/v1/blogs", blogRoute);
app.use("/api/v1/comments", commentRouter);
app.use("/api/v1/likes", likeRouter);
app.use("/api/v1/follow", followRouter);
app.use('/api/v1/notifications',notificationRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/bookmarks', bookmarkRouter);
app.use('/api/v1/history', historyRouter);

app.use((err, req, res, next) => {
  if (err?.type === "entity.too.large") {
    return res.status(413).json({
      success: false,
      message: "Uploaded image is too large. Please choose a smaller image.",
    });
  }

  return next(err);
});

const PORT = process.env.PORT || 8080;

const startServer = async () => {
  try {
    await prisma.$connect();
    console.log("Prisma connected successfully");

    app.listen(PORT, () => {
      console.log(` Server running on port ${PORT}`);
    });

  } catch (error) {
    console.error(" DB connection failed:", error.message);
  }
};

startServer();
