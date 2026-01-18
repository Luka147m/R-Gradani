interface LogEntry {
    timestamp: Date;
    level: 'info' | 'warn' | 'error' | 'debug';
    message: string;
    jobId: string;
    index: number;
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
    private logIndexCounters: Map<string, number> = new Map();

    startJob(jobId: string) {
        this.jobStatuses.set(jobId, {
            status: 'running',
            startedAt: new Date()
        });
        this.logIndexCounters.set(jobId, 0);
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

    getJobInfo(jobId: string, sinceIndex?: number) {
        const status = this.jobStatuses.get(jobId);
        const logs = this.getLogs(jobId, sinceIndex);

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

        const currentIndex = this.logIndexCounters.get(jobId) || 0;
        this.logIndexCounters.set(jobId, currentIndex + 1);

        const jobLogs = this.logs.get(jobId)!;
        jobLogs.push({
            timestamp: new Date(),
            level,
            message,
            jobId,
            index: currentIndex
        });

        if (jobLogs.length > this.maxLogsPerJob) {
            jobLogs.shift();
        }
    }

    getLogs(jobId: string, sinceIndex?: number): LogEntry[] {
        const jobLogs = this.logs.get(jobId) || [];

        if (sinceIndex !== undefined) {
            return jobLogs.filter(log => log.index > sinceIndex);
        }

        return jobLogs;
    }

    clearLogs(jobId: string) {
        this.logs.delete(jobId);
        this.jobStatuses.delete(jobId);
        this.logIndexCounters.delete(jobId);
    }

    cleanup() {
        const now = Date.now();
        for (const [jobId, logs] of this.logs.entries()) {
            if (logs.length === 0) continue;

            const lastLog = logs[logs.length - 1];
            if (now - lastLog.timestamp.getTime() > this.logTTL) {
                this.logs.delete(jobId);
                this.jobStatuses.delete(jobId)
                this.logIndexCounters.delete(jobId);
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