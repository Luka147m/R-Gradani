import { Request, Response } from "express";
import * as commentsService from "./comments.service";

export const getCommentsByDatasetId = async (req: Request, res: Response) => {
  const datasetId = req.params.id;

  try {
    const comments = await commentsService.fetchCommentsByDatasetId(datasetId);
    res.status(200).json(comments);
  } catch (error) {
    res.status(500).json({ message: `${error}` });
  }
};
