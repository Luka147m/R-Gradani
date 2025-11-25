import React, { useState, useEffect } from 'react';

import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { Search, Home, LayoutDashboard } from 'lucide-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';
import { FilterContainer } from '../components/FilterContainer';
import { SearchResults } from '../components/SearchResults';
import '../HomePage.css';
import '../SearchPage.css';




function SearchPage() {

    const navigate = useNavigate();

    const [selectedPublisherIds, setSelectedPublisherIds] = useState<string[]>([]);
    const [ignoreSaved, setIgnoreSaved] = useState(false);
   
    const [searchParams] = useSearchParams();
    const [selected, setSelected] = useState<"home" | "profile">("home");
    const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');

    useEffect(() => {
        const query = searchParams.get('q') || '';
        setSearchTerm(query);
    }, [searchParams]);

    const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const input = (event.currentTarget.querySelector('.search-input') as HTMLInputElement);
        const newSearchTerm = input.value;
        
        // Navigiraj na novu search rutu s novim query parametrom
        if(newSearchTerm.trim() === '') {
            return; // Ne radi ništa ako je unos prazan
        }
        navigate(`/search?q=${encodeURIComponent(newSearchTerm)}`);
    };


  
    return (
        <>
            <div className="home-profile-selector">
                <Link to="/">
                    <button
                    className={`selector-btn ${selected === "home" ? "active-home" : ""}`}
                    onClick={() => setSelected("home")}
                    >
                    <Home size={24} />
                    </button>
                </Link>
                <Link to="/profile">
                    <button
                    className={`selector-btn profile-btn ${selected === "profile" ? "active-profile" : ""}`}
                    onClick={() => setSelected("profile")}
                    
                        
                    >
                    <LayoutDashboard  
                        size={24} 
                        />
                    </button>
                </Link>
            </div>
            <div className="main-container">
                <div className='search-skupovi-div'>
                    <div className='ikona-naslov-div'>
                        <Search className="ikona"/>
                        <h1 className='search-skupovi-h1'>Pretražite skupove podataka</h1>
                    </div>
                    <form className="search" onSubmit={handleSearch}>
                        <input type="text" placeholder="Unesite naziv skupa podataka" className = "search-input"/>
                        <button className="search-button" type = "submit"><FontAwesomeIcon icon={faMagnifyingGlass} /></button>
                    </form>
                </div>


                <div className="search-results-container">
                    <FilterContainer 
                        onPublisherFilterChange={setSelectedPublisherIds}
                        onIgnoreSavedChange={setIgnoreSaved}
                    />
                    <SearchResults 
                        searchTerm={searchTerm} 
                        publisherIds={selectedPublisherIds}
                        ignoreSaved={ignoreSaved}
                    />

                </div>
            
            </div>
        
        </>
    );
}

export default SearchPage;