import { Wrench } from 'lucide-react';
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
}

interface JobStatusResponse {
  success: boolean;
  jobId: string;
  status: 'running' | 'completed' | 'failed';
  isComplete: boolean;
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
  const [jobStatus, setJobStatus] = useState<'running' | 'completed' | 'failed'>('running');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const logsContainerRef = useRef<HTMLDivElement>(null);

  const lastTimestampRef = useRef<string | null>(null);
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
    lastTimestampRef.current = null;
  };

  const submitResponse = async () => {
    setIsWorking(true);
    setLogs([]);
    setErrorMessage(null);

    try {
      const response = await api.post('/upload');

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

  // Polling za logove
  useEffect(() => {
    if (!jobId) return;

    const pollJobStatus = async () => {
      try {
        const params = new URLSearchParams();
        if (lastTimestampRef.current) {
          params.append('since', lastTimestampRef.current);
        }

        const response = await api.get<JobStatusResponse>(
          `/upload/logs/${jobId}?${params}`);

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
          setLogs((prev) => [...prev, ...response.data.logs]);

          const lastLog = response.data.logs[response.data.logs.length - 1];
          lastTimestampRef.current = lastLog.timestamp;
        }

        setJobStatus(response.data.status);

        if (response.data.isComplete) {
          setIsCompleted(true);
          
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
                      <div className = 'status' style={{ 
                        backgroundColor: jobStatus === 'completed' ? '#dcfce7' : '#fee2e2',
                        color: jobStatus === 'completed' ? '#166534' : '#991b1b',
                      }}>
                        {jobStatus === 'completed' ? 'Analiza uspješna!' : 'Analiza neuspješna'}
                      </div>
                    )}

                    {errorMessage && (
                      <div className = 'status' style={{
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
               
                {isCompleted && (
                  <button
                    className="close-logs-button"
                    onClick={() => {
                      setIsCompleted(false);
                      setIsWorking(false);
                      setLogs([]);
                    }}
                  >
                    Zatvori logove
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
