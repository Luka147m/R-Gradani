import { useParams, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import CommentCard from "../components/CommentCard";
import {MessageCircle} from "lucide-react";
import "../DatasetPage.css";

type DatasetState = {
  id?: string;
  name?: string;
  url?: string;
  created?: string;
};

type Analysis = {
  id: number;
  user_id: number;
  subject: string;
  message: string;
  created: string;
};

const DatasetPage = () => {
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const params = useParams();
  const location = useLocation();
  const state = (location.state || {}) as DatasetState;
  
  const id = state.id ?? params.id;
  const name = state.name ?? params.name;
  const url = state.url ?? params.url;
  const created = state.created ?? params.created;

  useEffect(() => {
    const fetchAnalyses = async () => {
      // try {
      //   const response = await fetch(`/api/datasets/${id}/analyses`);
      //   if (!response.ok) {
      //     throw new Error('Failed to fetch analyses');
      //   }
      //   const data = await response.json();
      //   setAnalyses(data);
      // } catch (err) {
      //   setError(err instanceof Error ? err.message : 'An error occurred');
      // } finally {
      //   setLoading(false);
      // }
      // Mock data for demonstration purposes
      const mockData: Analysis[] = [
        {
          id: 1,
          user_id: 1,
          subject: "Analiza pristupačnosti podataka",
          message: "<p>Podaci su dobro strukturirani i lako dostupni. Međutim, nedostaje detaljnija dokumentacija o metodologiji prikupljanja.</p>",
          created: "2025-10-08T10:30:00Z"
        },
        {
          id: 2,
          user_id: 2,
          subject: "Kvaliteta podataka kroz vrijeme",
          message: "<p>Primjećuje se značajno poboljšanje u kvaliteti podataka od 2024. godine. Posebno je vidljiv napredak u standardizaciji formata.</p>",
          created: "2025-10-09T14:15:00Z"
        },
        {
          id: 3,
          user_id: 3,
          subject: "Mogućnosti za poboljšanje",
          message: "<p>Predlažem dodavanje metapodataka o učestalosti ažuriranja. Također bi bilo korisno imati API dokumentaciju.</p>",
          created: "2025-10-10T09:45:00Z"
        },
        {
          id: 4,
          user_id: 1,
          subject: "Tehnička analiza formata",
          message: "<p>CSV format je prikladan za ovaj tip podataka. Preporučujem dodavanje izvoza u JSON format za lakšu integraciju.</p>",
          created: "2025-10-11T16:20:00Z"
        }
      ];
      
      setAnalyses(mockData);
      setLoading(false);
    };

    if (id) {
      fetchAnalyses();
    }
  }, [id]);

  return (
    <div className="main-container">
      <h1 className="dataset-title">{name}</h1>
      <a href={url}><h3 className="dataset-url">{url}</h3></a>
      
      <label className="pregled-komentara-lable">
        <MessageCircle size={24} /> 
        <h2>Pregled komentara</h2>
      </label>

      <div className="comments">
        {loading && <p>Loading analyses...</p>}
        {analyses.map((analysis, index) => (
          <>
            <label htmlFor="" className="commentIndex">Komentar {index + 1} / {analyses.length}</label>

            <CommentCard
              key={analysis.id} 
              user_id={analysis.user_id}
              subject={analysis.subject}
              message={analysis.message}
              created={analysis.created} />
          </>
        ))}
      
      </div>
    </div>
  );
};

export default DatasetPage;