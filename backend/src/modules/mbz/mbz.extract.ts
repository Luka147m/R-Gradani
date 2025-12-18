import fs from 'fs';
import * as tar from 'tar';

export async function extractMbz(filePath: string, targetDir: string) {
    await fs.promises.mkdir(targetDir, { recursive: true });

    await tar.extract({
        file: filePath,
        cwd: targetDir
    });
}