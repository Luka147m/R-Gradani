import { useState } from 'react'
import { CloudOff, Home, LayoutDashboard, Search} from "lucide-react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons/faMagnifyingGlass';
import { IzdvojeniSkupoviPodataka } from './components/IzdvojeniSkupoviPodataka';



function filterAnalyses(event: React.MouseEvent<HTMLButtonElement>) {
    // Function to filter analyses based on search input
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

import './App.css'

function App() {
  
  const [selected, setSelected] = useState<"home" | "profile">("profile");

  return (
    <>
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
          <LayoutDashboard  size={24} />
        </button>
      </div>
      <div className="main-container">
        <div className='search-skupovi-div'>
          <div className='ikona-naslov-div search-skupovi-div'>
                <Search className="ikona"/>
                <h2 className='search-skupovi-h2'>Pretražite skupove podataka</h2>
          </div>
          <form className="search">
              <input type="text" placeholder="Unesite naziv skupa podataka" className = "search-input"/>
              <button className="search-button" type = "submit" onClick ={filterAnalyses}><FontAwesomeIcon icon={faMagnifyingGlass} /></button>
          </form>
        </div>
        <div>
          <IzdvojeniSkupoviPodataka />
        </div>
      </div>
    </>
  );
}

export default App;
