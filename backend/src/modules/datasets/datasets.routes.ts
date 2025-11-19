import { Router } from "express";
import * as datasetsController from "./datasets.controller";
import commentsRouter from "../comments/comments.routes";

const router = Router();

router.get("/", datasetsController.getAllDatasets);

router.get("/nedavno", datasetsController.getRecentDatasets);

router.get("/:id", datasetsController.getDatasetById);

router.use("/:id/komentari", commentsRouter);

export default router;
