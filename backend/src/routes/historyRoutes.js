import express from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import {
  clearMyReadHistory,
  getMyReadHistory,
  recordReadHistory,
} from "../controllers/history.controller.js";

const historyRouter = express.Router();

historyRouter.post("/read/:postid", authMiddleware, recordReadHistory);
historyRouter.get("/my", authMiddleware, getMyReadHistory);
historyRouter.delete("/my", authMiddleware, clearMyReadHistory);

export default historyRouter;
