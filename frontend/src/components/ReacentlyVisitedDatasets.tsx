import { DatasetCard } from "./DatasetCard.tsx";
import "../style/IzdvojeniSkupoviPodataka.css";
import { History } from "lucide-react";
import "../style/HomePage.css";
import { useState, useEffect } from "react";
import api from "../api/axios.tsx";
import type { getDatasetDTO } from "../DTOs/getDatasetDTO.ts";
import { useUserContext } from "../providers/UserContextProvider.tsx";

export const RecentlyVisitedDatasets = () => {
  const [recentlyVisitedDatasetsData, setRecentlyVisitedDatasetsData] =
    useState<getDatasetDTO[]>([]);

  const { recentlyVisitedDatasets } = useUserContext();

  useEffect(() => {
    const fetchRecentlyVisitedDatasets = async () => {
      const response = await api.post("/skupovi/ids", {
        ids: recentlyVisitedDatasets,
      });
      setRecentlyVisitedDatasetsData(response.data);
    };
    fetchRecentlyVisitedDatasets();
  }, [recentlyVisitedDatasets]);

  return (
    <div className="search-skupovi-div">
      <div className="ikona-naslov-div">
        <History className="ikona" />
        <h1 className="search-skupovi-h1">
          Nedavno posjećeni skupovi podataka
        </h1>
      </div>
      <div className="skupovi-podataka-grid">
        {recentlyVisitedDatasets.length > 0 ? (
          recentlyVisitedDatasets.map((id) => (
            <DatasetCard
              key={id}
              {...recentlyVisitedDatasetsData[
                recentlyVisitedDatasetsData.findIndex((i) => i.id === id)
              ]}
            ></DatasetCard>
          ))
        ) : (
          <div className="muted">Nemate zabilježenih skupova podataka</div>
        )}
      </div>
    </div>
  );
};
