import multer from 'multer';
import path from 'path';
import fs from 'fs';

function getUploadDir() {
    if (process.env.NODE_ENV === 'production') {
        return '/tmp/mbz-uploads';
    }

    // development
    return path.join(process.cwd(), 'tmp', 'mbz-uploads');
}

const uploadDir = getUploadDir();

fs.mkdirSync(uploadDir, { recursive: true });

export const upload = multer({
    dest: uploadDir,
    limits: {
        fileSize: 100 * 1024 * 1024 // 100 MB
    },
    fileFilter(req, file, cb) {
        if (!file.originalname.endsWith('.mbz')) {
            return cb(new Error('Only .mbz files are allowed'));
        }
        cb(null, true);
    }
});
