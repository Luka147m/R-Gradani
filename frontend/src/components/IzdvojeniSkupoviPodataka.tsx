import { DatasetCard } from "./DatasetCard.tsx";
import "../style/IzdvojeniSkupoviPodataka.css";
import { BadgeAlert } from "lucide-react";
import "../style/HomePage.css";
import { useState, useEffect } from "react";

import { getDatasetDTO } from "../DTOs/getDatasetDTO.ts";
import api from "../api/axios.tsx";

export const IzdvojeniSkupoviPodataka = () => {
  const [datasets, setDatasets] = useState<getDatasetDTO[]>([]);

  useEffect(() => {
    api.get("/skupovi/nedavno").then((response) => {
      setDatasets(response.data);
    });
  }, []);

  return (
    <div className="search-skupovi-div">
      <div className="ikona-naslov-div">
        <BadgeAlert className="ikona" />
        <h1 className="search-skupovi-h1">Skupovi podataka</h1>
      </div>
      <div className="skupovi-podataka-grid">
        {datasets.map((skupPodataka) => (
          <DatasetCard key={skupPodataka.id} {...skupPodataka} />
        ))}
      </div>
    </div>
  );
};
