import { Request, Response } from 'express';
import * as reponsesService from './responses.service';
import { logStore, cancelJob } from '../helper/logger';
import { randomUUID } from 'crypto';

export const getResponsesByCommentId = async (req: Request, res: Response) => {
  const commentId = Number(req.params.commentId);

  if (isNaN(commentId)) {
    return res.status(400).json({ message: 'Invalid comment ID' });
  }

  try {
    const comments = await reponsesService.getResponsesByCommentId(commentId);

    if (comments.length === 0) {
      return res
        .status(404)
        .json({ message: 'No responses found for this comment.' });
    }

    res.status(200).json(comments);
  } catch (error) {
    res.status(500).json({ message: `${error}` });
  }
};

export const getResponsesById = async (req: Request, res: Response) => {
  const responseId = Number(req.params.id);

  if (isNaN(responseId)) {
    return res.status(400).json({ message: 'Invalid response ID' });
  }
  try {
    const response = await reponsesService.getResponseById(responseId);

    if (!response) {
      return res.status(404).json({ message: 'Response not found.' });
    }
    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ message: `${error}` });
  }
};

// Pokretanje za samo jedan skup podataka
export const startAnalyzeOne = async (req: Request, res: Response) => {
  const { skupId } = req.params;

  if (!skupId) {
    return res.status(400).json({
      success: false,
      message: 'Dataset ID is required',
    });
  }

  const jobId = randomUUID();

  // Fja koja pokrece
  reponsesService.analyzeOneDataset(skupId, jobId);

  res.status(202).json({
    success: true,
    message: 'Analysis started...',
    jobId,
  });
};

// Pokretanje za sve dostupne od nule
export const startAnalyzeAll = async (req: Request, res: Response) => {
  const jobId = randomUUID();

  // Fja koja pokrece
  reponsesService.analyzeAll(jobId);

  res.status(202).json({
    success: true,
    message: 'Analysis started...',
    jobId,
  });
};

// Za dobivanje logova
export async function getJobStatus(req: Request, res: Response) {
  const { jobId } = req.params;
  const since = req.query.since
    ? parseInt(req.query.sinceIndex as string)
    : undefined;

  const jobInfo = logStore.getJobInfo(jobId, since);

  if (!jobInfo) {
    return res.status(404).json({
      success: false,
      message: 'Job not found',
    });
  }

  res.status(200).json({
    success: true,
    jobId,
    ...jobInfo,
  });
}

// Za otkazivanje
export const cancelAnalysis = async (req: Request, res: Response) => {
  const { jobId } = req.params;

  const cancelled = cancelJob(jobId);

  if (!cancelled) {
    return res.status(404).json({
      success: false,
      message: 'Job not found, not running, or already completed',
    });
  }

  res.status(200).json({
    success: true,
    message: 'Cancellation requested. Job will stop after current operation.',
    jobId,
  });
};
