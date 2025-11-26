import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import SearchPage from "./pages/SearchPage";
import DatasetPage from "./pages/DatasetPage";
import ProfilePage from "./pages/ProfilePage";
import PublisherSearchPage from './pages/PublisherSearchPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/search/publishers" element={<PublisherSearchPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/dataset/:id" element={<DatasetPage />} />
      </Routes>
    </Router>
  );
}

export default App;