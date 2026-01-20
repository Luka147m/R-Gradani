import { Wrench } from 'lucide-react';
import ApiButton from './ApiButton.tsx';
import IconText from './IconText.tsx';
import api from '../api/axios.tsx';
import { useState } from 'react';
import { AnalysisLogger } from './AnalysisLogger.tsx';

import '../style/ImportContainer.css';

type AnalyzeDatasetContainerProps = {
  skupId?: string;
};

export const AnalyzeDatasetContainer = ({
  skupId,
}: AnalyzeDatasetContainerProps) => {
  const [isSelected, setIsSelected] = useState<boolean>(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [isWorking, setIsWorking] = useState<boolean>(false);

  const submitTask = () => {
    setIsSelected(true);
    setJobId(null);
    setIsWorking(false);
  };

  const submitResponse = async () => {
    if (!skupId) {
      alert('Skup podataka nije definiran.');
      return;
    }
    setIsWorking(true);

    try {
      const response = await api.post(`/odgovori/analyze/${skupId}`);

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

  const handleJobComplete = (status: 'completed' | 'failed' | 'cancelled') => {
    console.log('Job completed with status:', status);
  };

  const handleCloseLogger = () => {
    setIsWorking(false);
    setJobId(null);
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
            {!isWorking && (<p>Klikom na gumb pokreni analizu za skup podataka</p>)}

            {!isWorking ? (
              <ApiButton apiCall={submitResponse} className="api-button">
                Potvrdi
              </ApiButton>
            ) : (
              jobId && (
                <AnalysisLogger
                  jobId={jobId}
                  onComplete={handleJobComplete}
                  onClose={handleCloseLogger}
                  showCancelButton={true}
                />
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
};
