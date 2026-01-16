import { Request, Response } from 'express';
import { importMbz } from './mbz.service';
import { MbzStructureError } from './mbz.data';
import { randomUUID } from 'crypto';

export async function uploadMbz(req: Request, res: Response) {
    if (!req.file) {
        return res.status(400).json({
            success: false,
            error: 'File missing'
        });
    }

    const jobId = randomUUID();

    importMbz(req.file.path, jobId).catch(err => {
        console.error(`Job ${jobId} failed:`, err);
    });

    res.status(202).json({
        success: true,
        message: 'Import started',
        jobId
    });
}

export async function getJobLogs(req: Request, res: Response) {
    const { jobId } = req.params;
    const since = req.query.since ? new Date(req.query.since as string) : undefined;

    const { logStore } = await import('./mbz.logs');
    const logs = logStore.getLogs(jobId, since);

    res.status(200).json({
        success: true,
        logs
    });
}