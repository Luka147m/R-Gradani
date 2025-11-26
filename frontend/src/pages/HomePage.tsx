import { useState } from 'react'
import { Link, useNavigate } from "react-router-dom";
import { Home, LayoutDashboard, Search } from "lucide-react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons/faMagnifyingGlass';
import { IzdvojeniSkupoviPodataka } from '../components/IzdvojeniSkupoviPodataka';
import { RecentPublishers } from '../components/recentPublishersCard';

import '../HomePage.css'



function HomePage() {
  const navigate = useNavigate();
  
  const [selected, setSelected] = useState<"home" | "profile">("home");

  const handsleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const searchTerm = (document.querySelector('.search-input') as HTMLInputElement).value;
    if(searchTerm.trim() === '') {
        return; // Ne radi ništa ako je unos prazan
    }
    navigate(`/search?q=${encodeURIComponent(searchTerm)}`);
  };


  const handlePublisherSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const searchTerm = (event.currentTarget.querySelector('.publisher-search-input') as HTMLInputElement).value;
    if(searchTerm.trim() === '') {
        return;
    }
    navigate(`/search/publishers?q=${encodeURIComponent(searchTerm)}`);
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
          <form className="search" onSubmit={handsleSearch}>
              <input type="text" placeholder="Unesite naziv skupa podataka" className = "search-input search-container"/>
              <button className="search-button" type = "submit" ><FontAwesomeIcon icon={faMagnifyingGlass} /></button>
          </form>
        </div>
        <IzdvojeniSkupoviPodataka />

        {/* Search za publishere  */}

        <div className='search-skupovi-div'>
          <div className='ikona-naslov-div'>
                <Search className="ikona"/>
                <h1 className='search-skupovi-h1'>Pretražite izdavače</h1>
          </div>
          <form className="search" onSubmit={handlePublisherSearch}>
              <input type="text" placeholder="Unesite naziv izdavača" className="publisher-search-input search-container"/>
              <button className="search-button" type="submit">
                <FontAwesomeIcon icon={faMagnifyingGlass} />
              </button>
          </form>
        </div>

        <RecentPublishers />
      </div>
    </>
  );
}

export default HomePage;
