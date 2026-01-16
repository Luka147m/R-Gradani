import { useState, useEffect } from 'react';

import { RecentlyVisitedDatasets } from '../components/ReacentlyVisitedDatasets';
import { MarkedDatasets } from '../components/MarkedDatasets';
import { CommentBubble } from '../components/CommentBubble.tsx';
import { ImportContainer } from '../components/ImportContainer.tsx';
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
          <div>
            <h2>Uvoz .mbz datoteke</h2>
            <ImportContainer />
          </div>

          <p>Placeholder za komponentu za unos single komentara?</p>
          <p>Placeholder za komponentu za pokretanje analiza?</p>
          <p>Placeholder za komponentu za postavljanje openai kljuca?</p>
          <p>
            Napraviti ove neke administrativne stvari kao svoja sekcija? cog
            icon? potrebno css popraviti
          </p>
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
