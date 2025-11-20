import { Request, Response } from 'express';
import * as initService from './init.service';
import { sendSuccess, sendError } from '../../utils/response';

export const getInit = async (_req: Request, res: Response) => {
    try {
        const init = await initService.fetchData();
        sendSuccess(res, 200, 'Initial data fetched successfully.', init);
    } catch (error) {
        sendError(res, 500, `${error}`);
    }
};

