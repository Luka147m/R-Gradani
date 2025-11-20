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

export const getDatasetById = async (req: Request, res: Response) => {
  const id = req.params.id;
  try {
    const dataset = await datasetsService.fetchDatasetById(id);
    if (dataset) {
      sendSuccess(res, 200, 'Dataset fetched successfully.', dataset);
    } else {
      sendError(res, 404, 'Dataset not found.');
    }
  } catch (error) {
    sendError(res, 500, `${error}`);
  }
};

// POST /skupovi/ids
// Body: { ids: ["id1", "id2", ...] }
export const getDatasetsByIds = async (req: Request, res: Response) => {
  try {
    const ids: string[] = req.body.ids;

    if (!ids || !Array.isArray(ids)) {
      return sendError(res, 400, 'Invalid input: ids must be an array of strings.');
    }

    const datasets = await datasetsService.fetchDatasetsByIds(ids);
    sendSuccess(res, 200, 'Datasets fetched successfully.', datasets);
  } catch (error) {
    sendError(res, 500, `${error}`);
  }
};


export const getDatasetsByPublisher = async (req: Request, res: Response) => {
  const { publisherId } = req.params;
  try {
    const datasets = await datasetsService.fetchDatasetsByPublisher(publisherId);
    sendSuccess(res, 200, 'Datasets fetched successfully.', datasets);
  } catch (error) {
    sendError(res, 500, `${error}`);
  }
};

export const getDatasetsByPublishers = async (req: Request, res: Response) => {
  try {
    const publisherIds: string[] = req.body.ids;

    if (!publisherIds || !Array.isArray(publisherIds)) {
      return sendError(res, 400, 'Invalid input: publisherIds must be an array of strings.');
    }

    const datasets = await datasetsService.fetchDatasetsByPublishers(publisherIds);
    sendSuccess(res, 200, 'Datasets fetched successfully.', datasets);
  } catch (error) {
    sendError(res, 500, `${error}`);
  }
};

export const getDatasetsByTagsOrPublishers = async (req: Request, res: Response) => {
  try {
    const { tags, publisherIds } = req.body;

    if ((!tags || !Array.isArray(tags)) && (!publisherIds || !Array.isArray(publisherIds))) {
      return sendError(res, 400, 'Invalid input: provide tags or publisherIds as arrays.');
    }

    const datasets = await datasetsService.fetchDatasetsByTagsOrPublishers(tags, publisherIds);
    sendSuccess(res, 200, 'Datasets fetched successfully.', datasets);
  } catch (error) {
    sendError(res, 500, `${error}`);
  }
};
