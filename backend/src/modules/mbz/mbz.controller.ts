import { Request, Response } from 'express';
import { importMbz } from './mbz.service';
import { MbzStructureError } from './mbz.data';

export async function uploadMbz(req: Request, res: Response) {
    if (!req.file) {
        return res.status(400).json({
            success: false,
            error: 'File missing'
        });
    }

    // console.log(req.file);

    try {
        await importMbz(req.file.path);
        res.status(200).json({
            success: true,
            message: 'Import successful'
        });
    } catch (err) {
        console.error(err);

        if (err instanceof MbzStructureError) {
            return res.status(400).json({
                success: false,
                error: err.message
            });
        }

        res.status(500).json({
            success: false,
            error: 'Import failed. Please check server logs for details.'
        });
    }
}