import { NextFunction, Request, Response } from "express";
import * as publisherService from "./publishers.service";
import { sendSuccess, sendError } from "../../utils/response";

export const getRecentDatasets = async (
  req: Request,
  res: Response
) => {
  try {
    const publishers =
      await publisherService.fetchRecentPublishers(
        5,
        "modified"
      );
    sendSuccess(
      res,
      200,
      "Publishers fetched successfully.",
      publishers
    );
  } catch (err) {
    sendError(res, 500, `${err}`);
  }
};

export const _ = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {};
