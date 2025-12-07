import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";

import DatasetPage from "./pages/DatasetPage";
import ProfilePage from "./pages/ProfilePage";
import { SearchProvider } from './providers/SearchProvider';
function App() {
  return (
    <SearchProvider>
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/dataset/:id" element={<DatasetPage />} />
        </Routes>
      </Router>
    </SearchProvider>
  );
}

export default App;