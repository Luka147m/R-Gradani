import { Request, Response } from "express";
import * as commentsService from "./comments.service";
import { create } from "domain";

export const getCommentById = async (req: Request, res: Response) => {
  const id = Number(req.params.id);

  if (isNaN(id)) {
    return res.status(400).json({ message: "Comment ID must be a number." });
  }

  try {
    const comment = await commentsService.fetchCommentById(id);
    if (comment) {
      res.status(200).json(comment);
    } else {
      res.status(404).json({ message: "Comment not found." });
    }
  } catch (error) {
    res.status(500).json({ message: `${error}` });
  }
};

export const getLatestAnalyzedComments = async (req: Request, res: Response) => {
  try {
    const comments = await commentsService.fetchLatestAnalyzedComments();
    res.status(200).json(comments);
  } catch (error) {
    res.status(500).json({ message: `${error}` });
  }
};

export const createComment = async (req: Request, res: Response) => {
  try {
    const { subject, text, skupId } = req.body;

    if (!subject || !text || !skupId) {
      return res.status(400).json({
        message: "Missing required fields: subject, text, and skupId are required.",
      });
    }

    const newComment = await commentsService.createComment({ subject, text, skupId });

    res.status(201).json(newComment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};