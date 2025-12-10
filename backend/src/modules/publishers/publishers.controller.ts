import { Request, Response } from "express";
import * as publishersService from "./publishers.service";

export const getPublishers = async (req: Request, res: Response) => {
  try {
    const publishers = await publishersService.fetchPublishers();
    res.status(200).json(publishers);
  } catch (error) {
    res.status(500).json({ message: `${error}` });
  }
};

export const getRecentlyActivePublishers = async (_req: Request, res: Response) => {
  try {
    const publishers = await publishersService.fetchRecentlyActivePublishers();
    res.status(200).json(publishers);
  } catch (error) {
    res.status(500).json({ message: `${error}` });
  }
};

export const searchPublishers = async (req: Request, res: Response) => {
  try {
    const { searchText } = req.body;
    const publishers = await publishersService.searchForPublishers(searchText);
    res.status(200).json(publishers);
  } catch (error) {
    res.status(500).json({ message: `${error}` });
  }
};
