import { Request, Response } from "express";
import * as statsService from "./stats.service";

export const getStats = async (_req: Request, res: Response) => {
  try {
    const stats = await statsService.fetchData();
    res.status(200).json(stats);
  } catch (error) {
    res.status(500).json({ message: `${error}` });
  }
};
