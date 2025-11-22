import { Request, Response } from "express";
import * as initService from "./init.service";

export const getInit = async (_req: Request, res: Response) => {
  try {
    const init = await initService.fetchData();
    res.status(200).json(init);
  } catch (error) {
    res.status(500).json({ message: `${error}` });
  }
};
