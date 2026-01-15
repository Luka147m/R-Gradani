import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";

import DatasetPage from "./pages/DatasetPage";
import ProfilePage from "./pages/ProfilePage";
import StatisticsPage from "./pages/StatisticsPage";
import AdvancedFilterPage from "./pages/AdvancedFilterPage";
import { SearchProvider } from "./providers/SearchProvider";
import DefaultLayout from "./pages/DefaultLayout";
import "./style/global/colors.css";
import "./style/global/common.css";
import { PathHistoryProvider } from "./providers/PathHistoryProvider";
import { PathTracker } from "./pages/header/PathTracker";

function App() {
  return (
    <SearchProvider>
      <PathHistoryProvider>
        <Router>
          <PathTracker></PathTracker>
          <Routes>
            <Route element={<DefaultLayout></DefaultLayout>}>
              <Route path="/" element={<HomePage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/dataset/:id" element={<DatasetPage />} />
              <Route path="/search" element={<AdvancedFilterPage />} />
              <Route path="/statistics" element={<StatisticsPage />} />
            </Route>
          </Routes>
        </Router>
      </PathHistoryProvider>
    </SearchProvider>
  );
}

export default App;
