import { Router } from "express";
import * as publisherController from "./publishers.controller";

const router = Router();

router.get("/nedavno", publisherController.getRecentDatasets);

export default router;
