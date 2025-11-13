import { Request, Response } from 'express';
import * as commentsService from './comments.service';
import { sendSuccess, sendError } from '../../utils/response';

export const getCommentsByDatasetId = async (req: Request, res: Response) => {
    const datasetId = req.params.id;

    try {
        const comments = await commentsService.fetchCommentsByDatasetId(datasetId);
        sendSuccess(res, 200, 'Comments fetched successfully.', comments);
    } catch (error) {
        sendError(res, 500, `${error}`);
    }
};