import { useState, useEffect } from 'react';

import { RecentlyVisitedDatasets } from '../components/ReacentlyVisitedDatasets';
import { MarkedDatasets } from '../components/MarkedDatasets';
import { CommentBubble } from '../components/CommentBubble.tsx';
import { ImportContainer } from '../components/ImportContainer.tsx';
import { AnalyzeAllContainer } from '../components/AnalyzeAllContainer.tsx';
import { Wrench } from 'lucide-react';
import '../style/HomePage.css';

interface RequestData {
  content: string;
  isFromComment: boolean;
  usvojenost: boolean;
  podudarnost: number;
}

function ProfilePage() {
  const [savedRequests, setSavedRequests] = useState<RequestData[]>([]);
  const [reportedRequests, setReportedRequests] = useState<RequestData[]>([]);

  // seed + load
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('savedRequests') || '[]');
    const reported = JSON.parse(
      localStorage.getItem('reportedRequests') || '[]',
    );

    if (Array.isArray(saved)) {
      setSavedRequests(saved);
    } else {
      setSavedRequests([]);
    }

    if (Array.isArray(reported)) {
      setReportedRequests(reported);
    } else {
      setReportedRequests([]);
    }
  }, []);

  return (
    <>
      <div className="main-container profile-page-container">
        <div className="sidebar">
          <div className="ikona-naslov-div">
            <Wrench className="ikona" />
            <h1 className="search-skupovi-h1">Postavke</h1>
          </div>

          {/*Privremeno ukran css od ispod kopmonenti"*/}

          <div className="search-skupovi-div">
          <div className="request-card">
            <h2>Uvoz .mbz datoteke</h2>
            <ImportContainer />
          </div>

          <div className="request-card">
            <h2>Pokreni analizu</h2>
            <AnalyzeAllContainer />
            <p>Pokreće analizu nad svim dostupnim podacima</p>
          </div>
          </div>

        </div>

        <div className="sidebar">
          <MarkedDatasets />
        </div>

        <div className="main-side">
          <RecentlyVisitedDatasets />

          <div className="request-card">
            <h2>Spremljeni zahtjevi</h2>
            {savedRequests.length === 0 ? (
              <p className="muted">Nema spremljenih zahtjeva.</p>
            ) : (
              <div className="comment-bubble-list">
                {savedRequests.map((req, idx) => (
                  <CommentBubble
                    key={`saved-${idx}`}
                    content={req.content}
                    isFromComment={true}
                    usvojenost={req.usvojenost}
                    podudarnost={req.podudarnost}
                    isProfilePage={true}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="request-card">
            <h2>Prijavljeni zahtjevi</h2>
            {reportedRequests.length === 0 ? (
              <p className="muted">Nema prijavljenih zahtjeva.</p>
            ) : (
              <div className="comment-bubble-list">
                {reportedRequests.map((req, idx) => (
                  <CommentBubble
                    key={`reported-${idx}`}
                    content={req.content}
                    isFromComment={true}
                    usvojenost={req.usvojenost}
                    podudarnost={req.podudarnost}
                    isProfilePage={true}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
export default ProfilePage;
