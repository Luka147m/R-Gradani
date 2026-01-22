import { useState, useEffect } from "react";

import { RecentlyVisitedDatasets } from "../components/ReacentlyVisitedDatasets";
import { MarkedDatasets } from "../components/MarkedDatasets";
import { CommentBubble } from "../components/CommentBubble.tsx";
import { ImportContainer } from "../components/ImportContainer.tsx";
import { AnalyzeAllContainer } from "../components/AnalyzeAllContainer.tsx";
import { Bookmark, Cloud, Flag, UserCog, Wrench } from "lucide-react";
import "../style/HomePage.css";
import IconText from "../components/IconText.tsx";

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
    const saved = JSON.parse(localStorage.getItem("savedRequests") || "[]");
    const reported = JSON.parse(
      localStorage.getItem("reportedRequests") || "[]",
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
    <div className="main-container">
      <div className="topper-wrapper">
        <div className="ikona-naslov-div">
          <UserCog className="ikona" />
          <h1 className="search-skupovi-h1">Dostupne akcije na poslužitelju</h1>
        </div>

        {/*Privremeno ukran css od ispod kopmonenti"*/}

        <div className="search-skupovi-div">
          <div className="request-card">
            <h2>
              <IconText icon={Cloud} text="Grupno uvezite komentare"></IconText>
            </h2>
            <p>
              Unesite više komentara zapakiranih u .mbz arhivu. Odabrani
              komentari će se pohraniti na poslužitelj i nad njima će se obaviti
              strojna obrada
            </p>
            <ImportContainer />
          </div>

          <div className="request-card">
            <h2>
              <IconText icon={Wrench} text="Pokrenite analizu"></IconText>
            </h2>
            <p>
              Na jednom mjestu pokrenite strojnu obradu nad svim dostupnim
              skupovima podataka
            </p>
            <AnalyzeAllContainer />
          </div>
        </div>
      </div>

      <div className="profile-page-container">
        <div className="left-col flex-col">
          <div className="sidebar">
            <RecentlyVisitedDatasets />
          </div>

          <div className="sidebar">
            <MarkedDatasets />
          </div>
        </div>

        <div className="right-col lex-col">
          <div className="flex-col">
            <div className="sidebar">
              <div className="flex-col">
                <div className="ikona-naslov-div">
                  <Bookmark className="ikona-profile" />
                  <h2 className="search-skupovi-h1">Zabilježene izjave</h2>
                </div>
                <div>
                  {savedRequests.length === 0 ? (
                    <p className="muted bottom-pad">
                      Nemate zabilježenih izjava
                    </p>
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
              </div>
            </div>

            <div className="sidebar">
              <div className="flex-col">
                <div className="ikona-naslov-div">
                  <Flag
                    className="ikona-profile"
                    style={{ color: "var(--error)" }}
                  />
                  <h2 className="search-skupovi-h1">Prijavljene izjave</h2>
                </div>
                {reportedRequests.length === 0 ? (
                  <p className="muted bottom-pad">Nemate prijavljenih izjava</p>
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
        </div>
      </div>
    </div>
  );
}
export default ProfilePage;
