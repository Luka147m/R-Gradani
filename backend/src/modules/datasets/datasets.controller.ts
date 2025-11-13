import { Request, Response } from 'express';
import * as datasetsService from './datasets.service';
import { sendSuccess, sendError } from '../../utils/response';

export const getAllDatasets = async (_req: Request, res: Response) => {
  try {
    const datasets = await datasetsService.fetchDatasets();
    sendSuccess(res, 200, 'Datasets fetched successfully.', datasets);
  } catch (error) {
    sendError(res, 500, `${error}`);
  }
};