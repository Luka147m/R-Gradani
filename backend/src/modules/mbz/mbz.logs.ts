interface LogEntry {
    timestamp: Date;
    level: 'info' | 'warn' | 'error' | 'debug';
    message: string;
    jobId: string;
}

class LogStore {
    private logs: Map<string, LogEntry[]> = new Map();
    private maxLogsPerJob = 100;
    private logTTL = 600000;

    addLog(jobId: string, level: LogEntry['level'], message: string) {
        if (!this.logs.has(jobId)) {
            this.logs.set(jobId, []);
        }

        const jobLogs = this.logs.get(jobId)!;
        jobLogs.push({
            timestamp: new Date(),
            level,
            message,
            jobId
        });

        if (jobLogs.length > this.maxLogsPerJob) {
            jobLogs.shift();
        }
    }

    getLogs(jobId: string, since?: Date): LogEntry[] {
        const jobLogs = this.logs.get(jobId) || [];

        if (since) {
            return jobLogs.filter(log => log.timestamp > since);
        }

        return jobLogs;
    }

    clearLogs(jobId: string) {
        this.logs.delete(jobId);
    }

    cleanup() {
        const now = Date.now();
        for (const [jobId, logs] of this.logs.entries()) {
            if (logs.length === 0) continue;

            const lastLog = logs[logs.length - 1];
            if (now - lastLog.timestamp.getTime() > this.logTTL) {
                this.logs.delete(jobId);
            }
        }
    }
}

export const logStore = new LogStore();


setInterval(() => logStore.cleanup(), 600000);


export function logToJob(jobId: string, level: LogEntry['level'], message: string) {
    console.log(`[${jobId}] ${level.toUpperCase()}: ${message}`);
    logStore.addLog(jobId, level, message);
}

export type { LogEntry };