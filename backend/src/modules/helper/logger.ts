interface LogEntry {
    timestamp: Date;
    level: 'info' | 'warn' | 'error' | 'debug';
    message: string;
    jobId: string;
}

interface JobStatus {
    status: 'running' | 'completed' | 'failed';
    startedAt: Date;
    completedAt?: Date;
    error?: string;
}

class LogStore {
    private logs: Map<string, LogEntry[]> = new Map();
    private jobStatuses: Map<string, JobStatus> = new Map();
    private maxLogsPerJob = 100;
    private logTTL = 600000;

    startJob(jobId: string) {
        this.jobStatuses.set(jobId, {
            status: 'running',
            startedAt: new Date()
        });
    }

    completeJob(jobId: string, success: boolean, error?: string) {
        const jobStatus = this.jobStatuses.get(jobId);
        if (jobStatus) {
            jobStatus.status = success ? 'completed' : 'failed';
            jobStatus.completedAt = new Date();
            if (error) {
                jobStatus.error = error;
            }
        }
    }

    getJobInfo(jobId: string, since?: Date) {
        const status = this.jobStatuses.get(jobId);
        const logs = this.getLogs(jobId, since);

        if (!status) {
            return null;
        }

        return {
            ...status,
            isComplete: status.status !== 'running',
            logs
        };
    }

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
        this.jobStatuses.delete(jobId);
    }

    cleanup() {
        const now = Date.now();
        for (const [jobId, logs] of this.logs.entries()) {
            if (logs.length === 0) continue;

            const lastLog = logs[logs.length - 1];
            if (now - lastLog.timestamp.getTime() > this.logTTL) {
                this.logs.delete(jobId);
                this.jobStatuses.delete(jobId)
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

export function startJob(jobId: string) {
    logStore.startJob(jobId);
}

export function completeJob(jobId: string, success: boolean = true, error?: string) {
    logStore.completeJob(jobId, success, error);
}


export type { LogEntry };