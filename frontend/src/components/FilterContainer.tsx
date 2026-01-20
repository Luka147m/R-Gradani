import { useMemo, useState, useEffect } from "react";
import { Building, Calendar, Search, Settings } from "lucide-react";

import { useSearch } from "../hooks/useSearch";
import { useSearchParams } from "react-router-dom";
import { getPublisherDTO } from "../DTOs/getPublisherDTO.ts";

import api from "../api/axios.tsx";

import type { getDatasetDTO } from "../DTOs/getDatasetDTO.ts";
import "../style/FilterContainer.css";
import { all } from "axios";

type FilterContainerProps = {
  localSearchTerm: string;
  allResults: getDatasetDTO[];
  setAllResults: React.Dispatch<React.SetStateAction<getDatasetDTO[]>>;
  hasSearched: boolean;
  setHasSearched: React.Dispatch<React.SetStateAction<boolean>>;
};

const FilterContainer = ({
  localSearchTerm,
  allResults,
  setAllResults,
  hasSearched,
  setHasSearched,
}: FilterContainerProps) => {
  const [, setSearchParams] = useSearchParams();
  const {
    setSearchTerm,
    selectedPublisherIds,
    setSelectedPublisherIds,
    publisherQuery,
    setPublisherQuery,
    dateRange,
    setDateRange,
    ignoreSaved,
    setIgnoreSaved,
    ignoreReported,
    setIgnoreReported,
  } = useSearch();

  const [tempPublisherIds, setTempPublisherIds] =
    useState<string[]>(selectedPublisherIds);
  const [tempDateRange, setTempDateRange] =
    useState<[string, string]>(dateRange);
  const [tempIgnoreSaved, setTempIgnoreSaved] = useState<boolean>(ignoreSaved);
  const [tempIgnoreReported, setTempIgnoreReported] =
    useState<boolean>(ignoreReported);

  const [publisherCounts, setPublisherCounts] = 
    useState<Record<string, number>>({});

  useEffect(
    () => setTempPublisherIds(selectedPublisherIds),
    [selectedPublisherIds],
  );
  useEffect(() => setTempDateRange(dateRange), [dateRange]);
  useEffect(() => setTempIgnoreSaved(ignoreSaved), [ignoreSaved]);
  useEffect(() => setTempIgnoreReported(ignoreReported), [ignoreReported]);

  const [publishers, setPublishers] = useState<getPublisherDTO[]>([]);
  const [showAllPublishers, setShowAllPublishers] = useState(false);

  useEffect(() => {
    api.get("/izdavaci").then((response) => {
      setPublishers(response.data);
    });
  }, []);

  const normalize = (str: string) =>
    str
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

  const filteredPublisher = useMemo(
    () =>
      publishers.filter((p) =>
        normalize(p.publisher ?? "").includes(normalize(publisherQuery)),
      ),
    [publisherQuery, publishers],
  );

  
  const publishersWithCounts = useMemo(
    () => filteredPublisher.filter((p) => (publisherCounts[String(p.id)] ?? 0) > 0),
    [filteredPublisher, publisherCounts],
  );

  const visiblePublishers = showAllPublishers
    ? publishersWithCounts
    : publishersWithCounts.slice(0, 5);

  
  useEffect(() => {
    if (allResults.length > 0) {
      const counts = allResults.reduce<Record<string, number>>((acc, result) => {
        const id = String(result.publisher_id ?? "unknown");
        acc[id] = (acc[id] || 0) + 1;
        return acc;
      }, {});
      setPublisherCounts(counts);
      console.log(localSearchTerm)
      console.log("Publisher counts updated:", counts);
      console.log("Sum of counts:", Object.values(counts).reduce((a, b) => a + b, 0));
      console.log("All Results:", allResults);
    } else {
      setPublisherCounts({});
      console.log("Publisher counts cleared");
    }
  }, [allResults]);
  

  

  const togglePublisher = (id: string, checked: boolean) => {
    setTempPublisherIds((prev) =>
      checked ? [...prev, id] : prev.filter((x) => x !== id),
    );
  };

  useEffect(() => {
    const allIds = publishersWithCounts.map((p) => p.id);
    setTempPublisherIds(allIds);
  }, [publishersWithCounts]);

  const handleDateChange = (type: "from" | "to", value: string) => {
    if (type === "from") {
      setTempDateRange([value, tempDateRange[1]]);
    } else {
      setTempDateRange([tempDateRange[0], value]);
    }
  };

  const handleApplyFilters = async () => {
    setSearchParams(localSearchTerm.trim() ? { q: localSearchTerm } : {});
    setSearchTerm(localSearchTerm);
    setSelectedPublisherIds(tempPublisherIds);
    setDateRange(tempDateRange);
    setIgnoreSaved(tempIgnoreSaved);
    setIgnoreReported(tempIgnoreReported);

    const visiblePublishers = showAllPublishers
      ? filteredPublisher
      : filteredPublisher.slice(0, 5);

    const checkedVisiblePublisherIds = visiblePublishers
      .filter((p) => tempPublisherIds.includes(p.id))
      .map((p) => p.id);

    const response = await api.post("/skupovi/filter", {
      publisherIds: checkedVisiblePublisherIds,
    });
    setAllResults(response.data);
    
  };

  return (
    <div className="filter-container">
      <div className="filter-section">
        {hasSearched && (
          <div className="filter-section">
            <div className="title">
              <Building size={20} />
              <h2>Izdavač</h2>
            </div>
            <div className="search-publisher"></div>
            <div className="publisher-list">
              {visiblePublishers.map((p) => (
                <div key={p.id} className="publisher-item">
                  <input
                    type="checkbox"
                    id={`publisher-${p.id}`}
                    className="publisher-checkbox"
                    checked={tempPublisherIds.includes(p.id)}
                    onChange={(e) => togglePublisher(p.id, e.target.checked)}
                  />
                  <label htmlFor={`publisher-${p.id}`}>
                    {p.publisher} ({publisherCounts[String(p.id)] ?? 0})
                  </label>
                </div>
              ))}

              {visiblePublishers.length === 0 && (
                <div className="publisher-item">
                  <em>Nema rezultata</em>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="filter-section">
        <div className="title">
          <Calendar size={20} />
          <h2>Datum objave</h2>
        </div>
        <div className="date-range-wrapper">
          <label htmlFor="date-from">Od</label>
          <input
            type="date"
            id="date-from"
            className="date-input"
            value={tempDateRange[0]}
            onChange={(e) => handleDateChange("from", e.target.value)}
          />
          <label htmlFor="date-to">do</label>
          <input
            type="date"
            id="date-to"
            className="date-input"
            value={tempDateRange[1]}
            onChange={(e) => handleDateChange("to", e.target.value)}
          />
        </div>
      </div>

      <div className="filter-section">
        <div className="title">
          <Settings size={20} />
          <h2>Ostalo</h2>
        </div>
        <div className="ignore-checkboxes">
          <div className="publisher-item">
            <input
              type="checkbox"
              id="ignore-saved-datasets-checkbox"
              className="publisher-checkbox"
              checked={tempIgnoreSaved}
              onChange={(e) => setTempIgnoreSaved(e.target.checked)}
            />
            <label
              htmlFor="ignore-saved-datasets-checkbox"
              className="publisher-label"
            >
              Ignoriraj spremljene skupove podataka
            </label>
          </div>
          <div className="publisher-item">
            <input
              type="checkbox"
              id="ignore-reported-datasets-checkbox"
              className="publisher-checkbox"
              checked={tempIgnoreReported}
              onChange={(e) => setTempIgnoreReported(e.target.checked)}
            />
            <label
              htmlFor="ignore-reported-datasets-checkbox"
              className="publisher-label"
            >
              Ignoriraj skupove podataka koji imaju prijavljene probleme
            </label>
          </div>
        </div>
      </div>

      <div className="filter-section">
        <button className="apply-filters-button" onClick={handleApplyFilters}>
          <Search size={18} />
          Pretraži
        </button>
      </div>
    </div>
  );
};

export { FilterContainer };
