import { useState } from 'react'
import { Home, User } from "lucide-react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons/faMagnifyingGlass';
import { IzdvojeniSkupoviPodataka } from '../components/IzdvojeniSkupoviPodataka';



function filterAnalyses(event: React.MouseEvent<HTMLButtonElement>) {
    
    event.preventDefault();
    
    const searchTerm = (document.querySelector('.search-input') as HTMLInputElement).value.toLowerCase();
    const analyses = document.querySelectorAll('.skup-podataka-card');
    
    analyses.forEach((analysis) => {
      const title = analysis.querySelector('h3')?.textContent?.toLowerCase() || '';
      if (title.includes(searchTerm)) {
        (analysis as HTMLElement).style.display = 'block';
      } else {
        (analysis as HTMLElement).style.display = 'none';
      }
    });
  }

import '../HomePage.css'

function HomePage() {
  
  const [selected, setSelected] = useState<"home" | "profile">("home");

  return (
    <>
      <div className="main-container">
        <div className='search-home-profile-div'>
          <form className="search">
              <input type="text" className = "search-input"/>
              <button className="search-button" type = "submit" onClick ={filterAnalyses}><FontAwesomeIcon icon={faMagnifyingGlass} /></button>
          </form>
          <div className="home-profile-selector">
            <button
              className={`selector-btn ${selected === "home" ? "active-home" : ""}`}
              onClick={() => setSelected("home")}
            >
              <Home size={24} />
            </button>

            <button
              className={`selector-btn profile-btn ${selected === "profile" ? "active-profile" : ""}`}
              onClick={() => setSelected("profile")}
            >
              <User size={24} />
            </button>
          </div>
        </div>
        <IzdvojeniSkupoviPodataka />
      </div>
    </>
  );
}

export default HomePage;
