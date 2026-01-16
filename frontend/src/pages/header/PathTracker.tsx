import { useLocation } from "react-router-dom";
import { usePathHistory } from "../../providers/PathHistoryProvider";
import { useEffect } from "react";

export function PathTracker() {
  const location = useLocation();
  const { addPath, checkAndReset, popLatestPath } = usePathHistory();

  useEffect(() => {
    if (checkAndReset()) {
      popLatestPath();
    } else {
      addPath(location.pathname);
    }
  }, [location.pathname]);

  return null;
}
