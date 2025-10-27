import { useState } from 'react'
import { Home, User } from "lucide-react";
import { IzdvojeniSkupoviPodataka } from './components/IzdvojeniSkupoviPodataka';



function filterAnalyses(event: React.MouseEvent<HTMLButtonElement>) {
    // Function to filter analyses based on search input

    event.preventDefault();

    const searchTerm = (document.querySelector('.search-input') as HTMLInputElement).value.toLowerCase();
    const analyses = document.querySelectorAll('.analiza-card');
    
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
      <form className="search">
        <div className="search-inner">
          <input type="text" className = "search-input"/>

          <button className="search-button" type = "submit" onClick ={filterAnalyses}>Search</button>
        </div>
          
          
      </form>
      <div className="main-container">
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
        <IzdvojeniSkupoviPodataka />
      </div>
    </>
  );
}

export default App;
