import { Router, Request, Response, NextFunction } from 'express';
import { upload } from '../../config/upload';
import { uploadMbz } from './mbz.controller';
import multer from 'multer';

export const mbzRouter = Router();

const handleMulterError = (err: any, req: Request, res: Response, next: NextFunction) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                error: 'File size exceeds 100MB limit'
            });
        }
        return res.status(400).json({
            success: false,
            error: err.message
        });
    }

    if (err) {
        return res.status(400).json({
            success: false,
            error: err.message
        });
    }

    next();
};

// Disableano dok ne bude dodana nekakva zastita na ovu rutu

mbzRouter.post(
    '/',
    upload.single('file'),
    handleMulterError,
    uploadMbz
);

export default mbzRouter;