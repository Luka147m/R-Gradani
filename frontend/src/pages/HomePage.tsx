import { useState } from 'react'
import { Link, useNavigate } from "react-router-dom";
import { Home, LayoutDashboard, Search } from "lucide-react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons/faMagnifyingGlass';
import { IzdvojeniSkupoviPodataka } from '../components/IzdvojeniSkupoviPodataka';
import { RecentPublishers } from '../components/recentPublishersCard';

import '../HomePage.css'


// function filterAnalyses(event: React.MouseEvent<HTMLButtonElement>) {
    
//     event.preventDefault();
    
//     const searchTerm = (document.querySelector('.search-input') as HTMLInputElement).value.toLowerCase();
//     const analyses = document.querySelectorAll('.skup-podataka-card');
    
//     analyses.forEach((analysis) => {
//       const title = analysis.querySelector('h3')?.textContent?.toLowerCase() || '';
//       if (title.includes(searchTerm)) {
//         (analysis as HTMLElement).style.display = 'block';
//       } else {
//         (analysis as HTMLElement).style.display = 'none';
//       }
//     });
//   }



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
              <input type="text" placeholder="Unesite naziv skupa podataka" className = "search-input"/>
              <button className="search-button" type = "submit" ><FontAwesomeIcon icon={faMagnifyingGlass} /></button>
          </form>
        </div>
        <IzdvojeniSkupoviPodataka />
        <RecentPublishers />
      </div>
    </>
  );
}

export default HomePage;
