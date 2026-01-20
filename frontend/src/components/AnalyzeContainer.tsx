import { Wrench, XCircle } from 'lucide-react';
import ApiButton from './ApiButton.tsx';
import IconText from './IconText.tsx';
import api from '../api/axios.tsx';
import { useState, useRef, useEffect } from 'react';

// Isti css
import '../style/ImportContainer.css';

interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  jobId: string;
  index: number;
}

interface JobStatusResponse {
  success: boolean;
  jobId: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  isComplete: boolean;
  isCancelled?: boolean;
  startedAt: string;
  completedAt?: string;
  error?: string;
  logs: LogEntry[];
}

export const AnalyzeContainer = () => {
  const [isSelected, setIsSelected] = useState<boolean>(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isWorking, setIsWorking] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [jobStatus, setJobStatus] = useState<
    'running' | 'completed' | 'failed' | 'cancelled'
  >('running');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
   const [isCancelling, setIsCancelling] = useState<boolean>(false);
  const logsContainerRef = useRef<HTMLDivElement>(null);

  const lastIndexRef = useRef<number>(-1);
  const pollingIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (logsContainerRef.current) {
      logsContainerRef.current.scrollTop =
        logsContainerRef.current.scrollHeight;
    }
  }, [logs]);

  const submitTask = () => {
    setIsSelected(true);
    setLogs([]);
    setJobId(null);
    setIsWorking(false);
    setJobStatus('running');
    setErrorMessage(null);
    setIsCancelling(false);
    lastIndexRef.current = -1;
  };

  const submitResponse = async () => {
    setIsWorking(true);
    setLogs([]);
    setErrorMessage(null);
    setIsCancelling(false);

    try {
      const response = await api.post('/odgovori/analyze');

      if (response.data.success && response.data.jobId) {
        setJobId(response.data.jobId);
      } else {
        alert('Greška pri pokretanju analiza.');
        setIsWorking(false);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Greška pri pokretanju analize.');
      setIsWorking(false);
    }
  };

  const cancelAnalysis = async () => {
    if (!jobId) return;

    setIsCancelling(true);

    try {
      const response = await api.post(`/odgovori/analyze/cancel/${jobId}`);

      if (response.data.success) {
        console.log('Cancellation requested');
      } else {
        alert('Greška pri otkazivanju analize.');
        setIsCancelling(false);
      }
    } catch (error) {
      console.error('Error cancelling job:', error);
      alert('Greška pri otkazivanju analize.');
      setIsCancelling(false);
    }
  };

  // Polling za logove
  useEffect(() => {
    if (!jobId) return;

    const pollJobStatus = async () => {
      try {
        const params = new URLSearchParams();
        if (lastIndexRef.current >= 0) {
          params.append('sinceIndex', lastIndexRef.current.toString());
        }

        const response = await api.get<JobStatusResponse>(
          `/odgovori/logs/${jobId}?${params}`,
        );

        if (!response.data.success) {
          console.error('Job not found');
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
          setIsWorking(false);
          alert('Job nije pronađen na serveru');
          return;
        }

        if (response.data.logs.length > 0) {
          setLogs((prev) => {
            const existingIndices = new Set(prev.map((log) => log.index));
            const newLogs = response.data.logs.filter(
              (log) => !existingIndices.has(log.index),
            );
            return [...prev, ...newLogs];
          });
        }

        setJobStatus(response.data.status);

        if (response.data.isComplete) {
          setIsCompleted(true);
          setIsCancelling(false);

          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }

          if (response.data.status === 'failed' && response.data.error) {
            setErrorMessage(response.data.error);
          }
        }
      } catch (error) {
        console.error('Failed to fetch job status:', error);
      }
    };

    // Svake sekunde
    pollingIntervalRef.current = window.setInterval(pollJobStatus, 1000);

    pollJobStatus();

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [jobId]);

  const getLogColor = (level: string) => {
    switch (level) {
      case 'error':
        return '#dc2626';
      case 'warn':
        return '#d97706';
      case 'info':
        return '#2563eb';
      case 'debug':
        return '#6b7280';
      default:
        return '#000';
    }
  };

    const getStatusColor = () => {
    switch (jobStatus) {
      case 'completed':
        return { backgroundColor: '#dcfce7', color: '#166534' };
      case 'failed':
        return { backgroundColor: '#fee2e2', color: '#991b1b' };
      case 'cancelled':
        return { backgroundColor: '#fef3c7', color: '#92400e' };
      default:
        return {};
    }
  };

   const getStatusMessage = () => {
    switch (jobStatus) {
      case 'completed':
        return 'Analiza uspješna!';
      case 'failed':
        return 'Analiza neuspješna';
      case 'cancelled':
        return 'Analiza otkazana';
      default:
        return '';
    }
  };

  return (
    <div className="import-container">
      <div className="button-wrapper">
        <button onClick={submitTask} className="api-button import-button">
          <IconText icon={Wrench} text="Pokreni analizu"></IconText>
        </button>
      </div>
      {isSelected && (
        <div className="overlay">
          <div className="import-modal">
            {!isWorking && (
              <button
                className="import-modal-close-button"
                onClick={() => setIsSelected(false)}
              >
                x
              </button>
            )}

            <h2>Pokretanje analize</h2>
            <p>Klikom na gumb pokreni analizu nad svi podacima</p>

            {!isWorking ? (
              <>
                <ApiButton apiCall={submitResponse} className="api-button">
                  Potvrdi
                </ApiButton>
              </>
            ) : (
              <div className="log-btn-wrapper">
                <div>
                  {isCompleted && (
                    <div className='status' style={getStatusColor()}>
                      {getStatusMessage()}
                    </div>
                  )}

                  {errorMessage && (
                    <div className='status' style={{
                      backgroundColor: '#fef2f2',
                      color: '#991b1b',
                    }}>
                      Greška: {errorMessage}
                    </div>
                  )}

                  <div className="logs-container" ref={logsContainerRef}>
                    {logs.length === 0 ? (
                      <p style={{ color: '#6b7280' }}>Čekanje na logove...</p>
                    ) : (
                      logs.map((log, idx) => (
                        <div
                          key={idx}
                          style={{
                            marginBottom: '4px',
                            color: getLogColor(log.level),
                          }}
                        >
                          <span
                            style={{ color: '#9ca3af', fontSize: '11px' }}
                          >
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </span>{' '}
                          <span style={{ fontWeight: 'bold' }}>
                            [{log.level.toUpperCase()}]
                          </span>{' '}
                          {log.message}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="button-group">
                  {!isCompleted && (
                    <button
                      className="cancel-button"
                      onClick={cancelAnalysis}
                      disabled={isCancelling}
                    >
                      <XCircle size={18} />
                      {isCancelling ? 'Otkazivanje...' : 'Otkaži analizu'}
                    </button>
                  )}

                  {isCompleted && (
                    <button
                      className="close-logs-button"
                      onClick={() => {
                        setIsCompleted(false);
                        setIsWorking(false);
                        setLogs([]);
                        setIsCancelling(false);
                      }}
                    >
                      Zatvori logove
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};