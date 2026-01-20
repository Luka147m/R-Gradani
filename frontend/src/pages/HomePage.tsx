import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, ArrowLeft, X } from "lucide-react";
import { IzdvojeniSkupoviPodataka } from "../components/IzdvojeniSkupoviPodataka";
import { FilterContainer } from "../components/FilterContainer";
import { SearchResults } from "../components/SearchResults";
import { useSearch } from "../hooks/useSearch";
import "../style/HomePage.css";
import type { DataSet } from "../types/dataset";
import api from "../api/axios.tsx";

function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [localSearchTerm, setLocalSearchTerm] = useState("");
  const [allResults, setAllResults] = useState<DataSet[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const { isSearchActivated, setIsSearchActivated, setSearchTerm } =
    useSearch();

  useEffect(() => {
    const query = searchParams.get("q") || "";
    if (query) {
      setLocalSearchTerm(query);
      setIsTransitioning(true);
      setTimeout(() => setIsSearchActivated(true), 50);
    }
  }, [searchParams, setIsSearchActivated]);

  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (localSearchTerm.trim() && isSearchActivated) {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      searchTimeoutRef.current = setTimeout(() => {
        api.post("/skupovi/search", { searchText: localSearchTerm }).then((response) => {
          setAllResults(response.data);
        }).catch((error) => {
          console.error("Search error:", error);
          setAllResults([]);
        });
      }, 500); // 500ms debounce - da ne spamamo svaki put kad korisnik kuca
    } else {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
        searchTimeoutRef.current = null;
      }
    }
  }, [localSearchTerm, isSearchActivated]);


  const performSearch = async (term: string) => {
    try {
      if (!term.trim()) {
        const resp = await api.get("/skupovi");
        setAllResults(resp.data);
      } else {
        const resp = await api.post("/skupovi/search", { searchText: term });
        setAllResults(resp.data);
      }
    } catch (error) {
      console.error("Search error:", error);
      setAllResults([]);
    } finally {
      setHasSearched(true);
    }
  };



  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      // potvrdi pretragu
      setSearchParams(localSearchTerm ? { q: localSearchTerm } : {});
      setSearchTerm(localSearchTerm);
      performSearch(localSearchTerm);
    }
  };

  const handleSearchFocus = () => {
    if (!isSearchActivated) {
      setIsTransitioning(true);
      setTimeout(() => setIsSearchActivated(true), 50);
    }
  };

  const handleClearSearch = () => {
    setLocalSearchTerm("");
    setSearchTerm(""); 
    setSearchParams({}); 
    setAllResults([]);
    setHasSearched(false);
  };

  const handleToHome = () => {
    setIsTransitioning(false);
    setIsSearchActivated(false);
    setLocalSearchTerm("");
    setSearchTerm("");
    setSearchParams({});
    setAllResults([]);
    setHasSearched(false);
  };

  return (
    <>
      <div
        className={`main-container ${isSearchActivated ? "search-active" : ""}`}
      >
        <div className="search-skupovi-div">
          <div className="ikona-naslov-div">
            <Search className="ikona" />
            <h1 className="search-skupovi-h1">Pretražite skupove podataka</h1>
          </div>
          <div className="search">
            {isSearchActivated && (
              <button
                className="search-back-button"
                type="button"
                onClick={handleToHome}
              >
                <ArrowLeft size={20} />
              </button>
            )}
            <input
              type="text"
              placeholder="Unesite naziv skupa podataka"
              className="search-input search-container"
              onFocus={handleSearchFocus}
              value={localSearchTerm}
              onChange={(e) => {
                setLocalSearchTerm(e.target.value);
                setAllResults([]);
                setHasSearched(false);
                }}
              onKeyDown={handleKeyDown}
            />
            {localSearchTerm && (
              <button
                className="search-clear-button"
                type="button"
                onClick={handleClearSearch}
              >
                <X size={20} />
              </button>
            )}
          </div>
        </div>

        {isSearchActivated ? (
          <div className="search-results-container">
            <FilterContainer
              localSearchTerm={localSearchTerm}
              allResults={allResults}
              setAllResults={setAllResults}
              hasSearched={hasSearched}
              setHasSearched={setHasSearched}
              
            />

            <SearchResults
              allResults={allResults}
              setAllResults={setAllResults}
              hasSearched={hasSearched}
            />
            
            
            </div>
        ) : (
          <div className={isTransitioning ? "izvojeni-skupovi-exit" : ""}>
            <IzdvojeniSkupoviPodataka />
          </div>
        )}
      </div>
    </>
  );
}

export default HomePage;
