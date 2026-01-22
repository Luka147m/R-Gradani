import { DatasetCard } from "./DatasetCard.tsx";
import { useState, useEffect } from "react";
import "../style/IzdvojeniSkupoviPodataka.css";
import { Bookmark } from "lucide-react";
import "../style/HomePage.css";
import api from "../api/axios.tsx";
import type { getDatasetDTO } from "../DTOs/getDatasetDTO.ts";

export const MarkedDatasets = () => {
  const [markedDatasets, setMarkedDatasets] = useState<getDatasetDTO[]>([]);

  useEffect(() => {
    const fetchMarkedDatasets = async () => {
      const arr = JSON.parse(localStorage.getItem("savedDatasets") || "[]");
      if (arr.length === 0) return;
      const response = await api.post("/skupovi/ids", { ids: arr });
      setMarkedDatasets(response.data);
    };
    fetchMarkedDatasets();
  }, []);

  return (
    <>
      <div className="search-skupovi-div">
        <div className="ikona-naslov-div">
          <Bookmark className="ikona-profile" />
          <h1 className="search-skupovi-h1">Zabilježeni skupovi podataka</h1>
        </div>
        {markedDatasets.length > 0 ? (
          <div className="marked-datasets">
            {markedDatasets.map((skupPodataka) => (
              <DatasetCard key={skupPodataka.id} {...skupPodataka} />
            ))}
          </div>
        ) : (
          <div className="muted">Nemate zabilježenih skupova podataka</div>
        )}
      </div>
    </>
  );
};
