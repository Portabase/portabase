import express, { Router } from "express";
import uploadRouter from "./upload";
import { loggingMiddleware } from "@/features/api/middleware";

const router: Router = express.Router();

router.use(loggingMiddleware);
router.use("/upload", uploadRouter);

export default router;