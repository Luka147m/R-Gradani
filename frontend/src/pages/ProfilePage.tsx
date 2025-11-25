
import { useState } from 'react'
import { Link } from "react-router-dom";
import { Home, LayoutDashboard } from "lucide-react";
import { RecentlyVisitedDatasets } from '../components/ReacentlyVisitedDatasets';
import {MarkedDatasets} from '../components/MarkedDatasets';

import '../HomePage.css'

function ProfilePage() {
  
    const [selected, setSelected] = useState<"home" | "profile">("profile");

    const savedRequests = JSON.parse(localStorage.getItem('savedRequests') || '[]');
    const reportedRequests = JSON.parse(localStorage.getItem('reportedRequests') || '[]');

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
        
        <RecentlyVisitedDatasets />
        <MarkedDatasets />

        <label htmlFor="savedRequests">Saved Requests</label>
        <textarea
            id="savedRequests"
            value={`-${savedRequests.join('\n\n-')}`}
            readOnly
            style={{ width: '100%', height: '200px', marginTop: '10px' }}
        />

        <label htmlFor="reportedRequests">Reported Requests</label>
        <textarea
            id="reportedRequests"
            value={`-${reportedRequests.join('\n\n-')}`}
            readOnly
            style={{ width: '100%', height: '200px', marginTop: '10px' }}
        />
        
      </div>
    </>
  );
}
export default ProfilePage;