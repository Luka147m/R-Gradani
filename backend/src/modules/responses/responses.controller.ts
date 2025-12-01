import { Request, Response } from "express";
import * as reponsesService from "./responses.service";

export const getResponsesByCommentId = async (req: Request, res: Response) => {
  const commentId = Number(req.params.id);

  if (isNaN(commentId)) {
    return res.status(400).json({ message: "Invalid comment ID" });
  }

  try {
    const comments = await reponsesService.fetchResponsesByCommentId(commentId);
    res.status(200).json(comments);
  } catch (error) {
    res.status(500).json({ message: `${error}` });
  }
};
