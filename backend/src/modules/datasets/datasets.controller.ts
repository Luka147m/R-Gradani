import { Request, Response } from "express";
import * as datasetsService from "./datasets.service";

export const getAllDatasets = async (_req: Request, res: Response) => {
  try {
    const datasets = await datasetsService.fetchDatasets();
    res.status(200).json(datasets);
  } catch (error) {
    res.status(500).json({ message: `${error}` });
  }
};

export const getLatestDatasets = async (_req: Request, res: Response) => {
  try {
    const datasets = await datasetsService.fetchLatestFetchedDatasets(10);
    res.status(200).json(datasets);
  } catch (error) {
    res.status(500).json({ message: `${error}` });
  }
};

export const getDatasetById = async (req: Request, res: Response) => {
  const id = req.params.id;
  try {
    const dataset = await datasetsService.fetchDatasetById(id);
    if (dataset) {
      res.status(200).json(dataset);
    } else {
      res.status(404).json({ message: "Dataset not found." });
    }
  } catch (error) {
    res.status(500).json({ message: `${error}` });
  }
};

// POST /skupovi/ids
// Body: { ids: ["id1", "id2", ...] }
export const getDatasetsByIds = async (req: Request, res: Response) => {
  try {
    const ids: string[] = req.body.ids;

    if (!ids || !Array.isArray(ids)) {
      return res.status(400).json({ message: "Invalid input: ids must be an array of strings." });
    }

    const datasets = await datasetsService.fetchDatasetsByIds(ids);
    res.status(200).json(datasets);
  } catch (error) {
    res.status(500).json({ message: `${error}` });
  }
};

export const searchDatasets = async (req: Request, res: Response) => {
  try {
    const { searchText, publisherIds, ignoreMarked, markedIds } = req.body;

    const datasets = await datasetsService.searchDatasets({
      searchText,
      publisherIds,
      ignoreMarked,
      markedIds,
    });

    res.status(200).json(datasets);
  } catch (error) {
    res.status(500).json({ message: `${error}` });
  }
};

export const getDatasetsByPublisher = async (req: Request, res: Response) => {
  const { id: publisherId } = req.params;
  try {
    const datasets = await datasetsService.fetchDatasetsByPublisher(publisherId);
    res.status(200).json(datasets);
  } catch (error) {
    res.status(500).json({ message: `${error}` });
  }
};

export const getDatasetsByPublishers = async (req: Request, res: Response) => {
  try {
    const publisherIds: string[] = req.body.ids;

    if (!publisherIds || !Array.isArray(publisherIds)) {
      return res.status(400).json({ message: "Invalid input: publisherIds must be an array of strings." });
    }

    const datasets = await datasetsService.fetchDatasetsByPublishers(publisherIds);
    res.status(200).json(datasets);
  } catch (error) {
    res.status(500).json({ message: `${error}` });
  }
};

export const getDatasetsByTagsOrPublishers = async (req: Request, res: Response) => {
  try {
    const { tags, publisherIds } = req.body;

    if ((!tags || !Array.isArray(tags)) && (!publisherIds || !Array.isArray(publisherIds))) {
      return res.status(400).json({ message: "Invalid input: provide tags or publisherIds as arrays." });
    }

    const datasets = await datasetsService.fetchDatasetsByTagsOrPublishers(tags, publisherIds);
    res.status(200).json(datasets);
  } catch (error) {
    res.status(500).json({ message: `${error}` });
  }
};

export const getCommentsByDatasetId = async (req: Request, res: Response) => {
  const datasetId = req.params.id;

  try {
    const comments = await datasetsService.fetchCommentsByDatasetId(datasetId);
    res.status(200).json(comments);
  } catch (error) {
    res.status(500).json({ message: `${error}` });
  }
};

export const refreshDatasetData = async (req: Request, res: Response) => {
  try {
    const ok = await datasetsService.refreshDatasetData(req.params.id);

    if (!ok) {
      return res.sendStatus(404);
    }

    return res.sendStatus(204);
  } catch (error) {
    return res.sendStatus(500);
  }
};