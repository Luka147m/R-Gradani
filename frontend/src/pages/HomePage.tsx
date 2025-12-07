import { useEffect, useState } from 'react'
import { Link, useSearchParams } from "react-router-dom";
import { Home, LayoutDashboard, Search, X } from "lucide-react";
import { IzdvojeniSkupoviPodataka } from '../components/IzdvojeniSkupoviPodataka';
import { FilterContainer } from '../components/FilterContainer';
import { SearchResults } from '../components/SearchResults';
import { useSearch } from '../hooks/useSearch';
import '../style/HomePage.css'

function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [localSearchTerm, setLocalSearchTerm] = useState('');
  
  const {
    isSearchActivated,
    setIsSearchActivated,
  } = useSearch();

  useEffect(() => {
    const query = searchParams.get('q') || '';
    if(query) {
      setLocalSearchTerm(query);
      setIsTransitioning(true);
      setTimeout(() => setIsSearchActivated(true), 50);
    } else {
      setIsSearchActivated(false);
      setIsTransitioning(false);
    }
  }, [searchParams, setIsSearchActivated])

  const handleSearchFocus = () => {
    if(!isSearchActivated) {
      setIsTransitioning(true);
      setTimeout(() => setIsSearchActivated(true), 50);
    }
  }

  const handleClearSearch = () => {
    setIsTransitioning(false);
    setIsSearchActivated(false);
    setLocalSearchTerm('');
    setSearchParams({});
  }

  const handleToHome = () => {
    setIsTransitioning(false);
    setIsSearchActivated(false);
    setLocalSearchTerm('');
    setSearchParams({});
  }

  return (
    <>
      <div className="home-profile-selector">
        <Link to="/">
          <button
            className={`selector-btn ${!isSearchActivated ? "active-home" : ""}`}
            onClick={handleToHome}
          >
            <Home size={24} />
          </button>
        </Link>
        <Link to="/profile">
          <button
            className={`selector-btn profile-btn`}
          >
            <LayoutDashboard size={24} />
          </button>
        </Link>
      </div>

      <div className={`main-container ${isSearchActivated ? 'search-active' : ''}`}>
        <div className='search-skupovi-div'>
          <div className='ikona-naslov-div'>
            <Search className="ikona"/>
            <h1 className='search-skupovi-h1'>Pretražite skupove podataka</h1>
          </div>
          <div className="search">
            <input 
              type="text" 
              placeholder="Unesite naziv skupa podataka" 
              className="search-input search-container"
              onFocus={handleSearchFocus}
              value={localSearchTerm}
              onChange={(e) => setLocalSearchTerm(e.target.value)}
            />
            {isSearchActivated && (
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
            <FilterContainer localSearchTerm={localSearchTerm} />
            <SearchResults />
          </div>
        ) : (
          <div className={isTransitioning ? 'izvojeni-skupovi-exit' : ''}>
            <IzdvojeniSkupoviPodataka />
          </div>
        )}
        
      </div>
    </>
  );
}

export default HomePage;
