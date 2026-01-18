import fs from 'fs/promises';
import path from 'path';
import { extractMbz } from './mbz.extract';
import { importToDatabase } from './mbz.import';
import { logToJob } from './../helper/logger';
import os from 'os';

function getTempBaseDir() {
    if (process.env.NODE_ENV === 'production') {
        return os.tmpdir();
    }

    // development
    return path.join(process.cwd(), 'tmp');
}

export async function importMbz(filePath: string, jobId: string) {
    const baseDir = getTempBaseDir();

    logToJob(jobId, 'info', 'Starting MBZ import...');
    await fs.mkdir(baseDir, { recursive: true });

    const targetDir = await fs.mkdtemp(
        path.join(baseDir, 'mbz-')
    );

    try {

        logToJob(jobId, 'info', 'Extracting archive...');
        await extractMbz(filePath, targetDir);
        // console.log(`Extracted MBZ to ${targetDir}`);
        logToJob(jobId, 'info', `Extracted to ${targetDir}`);

        logToJob(jobId, 'info', 'Importing to database...');
        // Ovdje import u bazu
        await importToDatabase(targetDir, jobId);
        // await testStoreData(targetDir);

        logToJob(jobId, 'info', 'Import completed successfully!');

    }
    catch (error) {
        logToJob(jobId, 'error', `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        // throw error;
    } finally {
        logToJob(jobId, 'debug', 'Cleaning up temporary files...');
        await fs.rm(filePath, { force: true });
        await fs.rm(targetDir, { recursive: true, force: true });
    }
}

async function listFiles(dir: string, skipDir: string): Promise<string[]> {
    let results: string[] = [];
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        const relative = path.relative(dir, fullPath);

        if (relative.startsWith(skipDir)) continue;

        if (entry.isDirectory()) {
            results = results.concat(await listFiles(fullPath, skipDir));
        } else {
            results.push(fullPath);
        }
    }

    return results;
}