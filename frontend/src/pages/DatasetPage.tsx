import { useParams, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import CommentCard from "../components/CommentCard";
import {MessageCircle} from "lucide-react";
import "../style/DatasetPage.css";
import type { Reply } from "../Reply";

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
  console.log(error, setError)
  const params = useParams();
  const location = useLocation();
  const state = (location.state || {}) as DatasetState;
  
  const id = state.id ?? params.id;
  const name = state.name ?? params.name;
  const url = state.url ?? params.url;
  const created = state.created ?? params.created;
  console.log(created)
  useEffect(() => {
    const fetchAnalyses = async () => {
    
      const mockData: Analysis[] = [
        {
          id: 1,
          user_id: 1,
          subject: "Analiza pristupačnosti podataka",
          message: "<p>Redovi završavaju skupom od 188 znakova što otežava parsiranje podataka jer se znak koristi kao separator u datoteci. Većina novčanih vrijednosti je izražena u eurima, no dva podatka imaju  vrijednosti izražene u kunama (544 LOAD -  Life of a Digi i  548  International Nursing) što može uzrokovati probleme. Projekt 582 Smart Accelerators of Cultural Heritage Entrepreneurship (SACHE) sadrži krivo upisane podatke (godina završetka projekta - 44651).</p>",
          created: "2025-10-08T10:30:00Z"
        },
        {
          id: 2,
          user_id: 2,
          subject: "Kvaliteta podataka kroz vrijeme",
          message: "<p>Primjećuje se značajno poboljšanje u kvaliteti podataka od 2024. godine. Posebno je vidljiv napredak u standardizaciji formata.</p>",
          created: "2025-10-09T14:15:00Z"
        },
        // {
        //   id: 3,
        //   user_id: 3,
        //   subject: "Mogućnosti za poboljšanje",
        //   message: "<p>Predlažem dodavanje metapodataka o učestalosti ažuriranja. Također bi bilo korisno imati API dokumentaciju.</p>",
        //   created: "2025-10-10T09:45:00Z"
        // },
        // {
        //   id: 4,
        //   user_id: 1,
        //   subject: "Tehnička analiza formata",
        //   message: "<p>CSV format je prikladan za ovaj tip podataka. Preporučujem dodavanje izvoza u JSON format za lakšu integraciju.</p>",
        //   created: "2025-10-11T16:20:00Z"
        // }
      ];
      
      setAnalyses(mockData);
      setLoading(false);
    };

    if (id) {
      fetchAnalyses();
    }
  }, [id]);

  const mockReplies: Reply[] = [
    {
      id: 1,
      analysis_id: 1,
      created: "2025-10-09T12:00:00Z",
      reply: 'Redovi završavaju skupom od 188 znakova što otežava parsiranje podataka jer se znak koristi kao separator u datoteci.',
      message: "Navedena izjava nije uvažena u aktualnoj inačici skupa podataka."
    },
    {
      id: 2,
      analysis_id: 1,
      created: "2025-10-10T15:30:00Z",
      reply: "Većina novčanih vrijednosti je izražena u eurima, no dva podatka imaju  vrijednosti izražene u kunama (544 LOAD -  Life of a Digi i  548  International Nursing) što može uzrokovati probleme.",
      message: "Ne mogu dati kvalitetan odgovor na ovu izjavu."
    },
    {
      id: 3,
      analysis_id: 1,
      created: "2025-10-11T09:45:00Z",
      reply: "Projekt 582 Smart Accelerators of Cultural Heritage Entrepreneurship (SACHE) sadrži krivo upisane podatke (godina završetka projekta - 44651).",
      message: "Ne mogu pronaći navedeni znakovni niz u skupu podataka"
    },
    {
      id: 4,
      analysis_id: 2,
      created: "2025-10-10T10:15:00Z",
      reply: "Primjećuje se značajno poboljšanje u kvaliteti podataka od 2024. godine.",
      message: "Drago mi je da ste primijetili poboljšanja u kvaliteti podataka."
    },
    {
      id: 5,
      analysis_id: 2,
      created: "2025-10-11T14:50:00Z",
      reply: "Posebno je vidljiv napredak u standardizaciji formata.",
      message: "Standardizacija formata je ključna za interoperabilnost podataka."
    }
  ];

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
              created={analysis.created}
              replies={mockReplies.filter(reply => reply.analysis_id === analysis.id)} />
          </>
        ))}
      
      </div>
    </div>
  );
};

export default DatasetPage;