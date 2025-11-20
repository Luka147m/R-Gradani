import { Request, Response } from 'express';
import * as publishersService from './publishers.service';
import { sendSuccess, sendError } from '../../utils/response';

export const getPublishers = async (req: Request, res: Response) => {

    try {
        const publishers = await publishersService.fetchPublishers();
        sendSuccess(res, 200, 'Comments fetched successfully.', publishers);
    } catch (error) {
        sendError(res, 500, `${error}`);
    }
};