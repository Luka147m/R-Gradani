import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";

import DatasetPage from "./pages/DatasetPage";
import ProfilePage from "./pages/ProfilePage";
import AdvancedFilterPage from "./pages/AdvancedFilterPage";
import { SearchProvider } from './providers/SearchProvider';
function App() {
  return (
    <SearchProvider>
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/dataset/:id" element={<DatasetPage />} />
          <Route path="/search" element={<AdvancedFilterPage />} />
        </Routes>
      </Router>
    </SearchProvider>
  );
}

export default App;