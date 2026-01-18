import { Request, Response } from "express";
import * as reponsesService from "./responses.service";
import { logStore } from '../helper/logger';
import { randomUUID } from 'crypto';


export const getResponsesByCommentId = async (req: Request, res: Response) => {
  const commentId = Number(req.params.commentId);

  if (isNaN(commentId)) {
    return res.status(400).json({ message: "Invalid comment ID" });
  }

  try {
    const comments = await reponsesService.getResponsesByCommentId(commentId);

    if (comments.length === 0) {
      return res.status(404).json({ message: "No responses found for this comment." });
    }

    res.status(200).json(comments);
  } catch (error) {
    res.status(500).json({ message: `${error}` });
  }
};

export const getResponsesById = async (req: Request, res: Response) => {
  const responseId = Number(req.params.id);

  if (isNaN(responseId)) {
    return res.status(400).json({ message: "Invalid response ID" });
  }
  try {
    const response = await reponsesService.getResponseById(responseId);

    if (!response) {
      return res.status(404).json({ message: "Response not found." });
    }
    res.status(200).json(response);
  }
  catch (error) {
    res.status(500).json({ message: `${error}` });
  }
};

// Ovo je pokretanje za jednog anamarija
// export const analyzeResponse = async (req: Request, res: Response) => {
//   // console.log("Pozvan analyzeResponse u controlleru.")
//   const responseId = Number(req.params.responseId);
//   // console.log(responseId);

//   if (isNaN(responseId)) {
//     return res.status(400).json({ message: "Invalid response ID" });
//   }
//   try {
//     const datasetId = req.body.datasetId;
//     // console.log(datasetId);
//     const response = await reponsesService.analyzeResponse(responseId, datasetId);

//     res.status(200).json(response);

//   }
//   catch (error) {
//     res.status(500).json({ message: `${error}` });
//   }
// };

// Pokretanje za sve dostupne od nule
export const analyzeAll = async (req: Request, res: Response) => {
  const jobId = randomUUID();

  // Fja koja pokrece
  reponsesService.analyzeAll(jobId);

  res.status(202).json({
    success: true,
    message: 'Analysis started...',
    jobId
  });

};

// Za dobivanje logova
export async function getJobStatus(req: Request, res: Response) {
  const { jobId } = req.params;
  const since = req.query.since ? parseInt(req.query.sinceIndex as string) : undefined;

  const jobInfo = logStore.getJobInfo(jobId, since);

  if (!jobInfo) {
    return res.status(404).json({
      success: false,
      message: 'Job not found'
    });
  }

  res.status(200).json({
    success: true,
    jobId,
    ...jobInfo
  });
}