import { useEffect, useState } from "react";
import { DatasetCard } from "./DatasetCard";
import { ArrowDownUp } from "lucide-react";
import { useSearch } from "../hooks/useSearch";
import "../style/SearchPage.css";
import type { getDatasetDTO } from "../DTOs/getDatasetDTO.ts";
import api from "../api/axios.tsx";

type SortOption = "title-asc" | "title-desc" | "date-desc" | "date-asc";

type SearchResultsProps = {
  allResults: getDatasetDTO[];
  setAllResults: React.Dispatch<React.SetStateAction<getDatasetDTO[]>>;
  hasSearched?: boolean;
};

const SearchResults = ({ allResults, setAllResults, hasSearched }: SearchResultsProps) => {
  const {
    searchTerm,
    selectedPublisherIds,
    ignoreSaved,
    ignoreReported,
    dateRange,
  } = useSearch();

  const [sortOption, setSortOption] = useState<SortOption>("date-desc");
  const [showAllDatasets, setShowAllDatasets] = useState(false);
  const [filteredResults, setFilteredResults] = useState<getDatasetDTO[]>([]);

  useEffect(() => {
    api.get("/skupovi/nedavno").then((response) => {
      setAllResults(response.data);
    });
  }, [setAllResults]);

  useEffect(() => {
    const savedIds: string[] = JSON.parse(
      localStorage.getItem("savedDatasets") || "[]",
    );
    const reportedIds: string[] = JSON.parse(
      localStorage.getItem("reportedDatasets") || "[]",
    );

    // debug

    let filtered = allResults;

    if (selectedPublisherIds.length > 0) {
      filtered = filtered.filter((d) =>
        selectedPublisherIds.includes(String(d.publisher_id ?? "")),
      );
    }

    if (ignoreSaved) {
      filtered = filtered.filter((d) => !savedIds.includes(d.id));
    }

    if (ignoreReported) {
      filtered = filtered.filter((d) => !reportedIds.includes(d.id));
    }

    if (dateRange[0]) {
      filtered = filtered.filter(
        (d) => new Date(d.created ?? 0) >= new Date(dateRange[0]),
      );
    }
    if (dateRange[1]) {
      const endDate = new Date(dateRange[1]);
      endDate.setDate(endDate.getDate() + 1);
      filtered = filtered.filter((d) => new Date(d.created ?? 0) < endDate);
    }

    setFilteredResults(sortResults(filtered, sortOption));
  }, [
    allResults,
    searchTerm,
    selectedPublisherIds,
    sortOption,
    ignoreSaved,
    ignoreReported,
    dateRange,
  ]);
  const sortResults = (
    data: getDatasetDTO[],
    option: SortOption,
  ): getDatasetDTO[] => {
    const sorted = [...data];
    switch (option) {
      case "title-asc":
        return sorted.sort((a, b) =>
          (a.title ?? "").localeCompare(b.title ?? ""),
        );
      case "title-desc":
        return sorted.sort((a, b) =>
          (b.title ?? "").localeCompare(a.title ?? ""),
        );
      case "date-desc":
        return sorted.sort(
          (a, b) =>
            new Date(b.created ?? 0).getTime() -
            new Date(a.created ?? 0).getTime(),
        );
      case "date-asc":
        return sorted.sort(
          (a, b) =>
            new Date(a.created ?? 0).getTime() -
            new Date(b.created ?? 0).getTime(),
        );
      default:
        return sorted;
    }
  };

  if (!hasSearched) {
    return (
      <div className="search-results">
        <div className="title-and-sort">
          <h2>Pritisni Enter za prikaz rezultata pretrage</h2>
        </div>
      </div>
    );
  }

  return (
    
    <div className="search-results">
      <div className="title-and-sort">
        <h2>
          {filteredResults.length}{" "}
          {filteredResults.length === 1 ? "rezultat" : "rezultata"} pretrage
        </h2>

        <div className="sort-options">
          <label htmlFor="sort-select">
            <ArrowDownUp />
          </label>
          <select
            id="sort-select"
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value as SortOption)}
          >
            <option value="title-asc">Naslovu (A-Z)</option>
            <option value="title-desc">Naslovu (Z-A)</option>
            <option value="date-desc">Datumu (najnovije)</option>
            <option value="date-asc">Datumu (najstarije)</option>
          </select>
        </div>
      </div>
      <div className="title-and-sort">
        {filteredResults.length > 10 && (
          <button
            type="button"
            className="select-all-btn"
            onClick={() => setShowAllDatasets((prev) => !prev)}
          >
            {showAllDatasets ? "Prikaži manje" : "Prikaži više"}
          </button>
        )}
      </div>
      <div className="search-result-grid">
        {filteredResults.slice(0, 10).map((dataset) => (
          <DatasetCard key={dataset.id} {...dataset} />
        ))}

        {filteredResults.length === 0 && (
          <div>
            <em>Nema rezultata za prikaz</em>
          </div>
        )}
        {showAllDatasets &&
          filteredResults
            .slice(10)
            .map((p) => <DatasetCard key={p.id} {...p} />)}
      </div>
    </div>
  );
};

export { SearchResults };
