import { createContext, useContext, useState, type ReactNode } from "react";

interface PathHistoryContextType {
  history: string[];
  addPath: (path: string) => void;
  popLatestPath: () => string | null;
  getLatestPath: () => string | null;
  skipNextAdd: () => void;
  checkAndReset: () => boolean;
}

const PathHistoryContext = createContext<PathHistoryContextType | undefined>(
  undefined
);

export const PathHistoryProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [history, setHistory] = useState<string[]>([]);
  const [skipNext, setSkipNext] = useState(false);

  const addPath = (path: string) => {
    if (skipNext) {
      setSkipNext(false);
      return;
    }
    setHistory((prev) => {
      if (prev[0] === path) return prev; // zaustavi duplicirane uzastopne zapise
      const newHistory = [path, ...prev];
      return newHistory.slice(0, 25); // pohrani maksimalno 25 lokacija
    });
  };

  const popLatestPath = (): string | null => {
    let latest: string | null = null;
    setHistory((prev) => {
      if (prev.length === 0) return [];
      latest = prev[0];
      return prev.slice(1);
    });
    return latest;
  };

  const getLatestPath = () => (history.length > 1 ? history[1] : null);

  const skipNextAdd = () => setSkipNext(true);
  const checkAndReset = () => {
    const current = skipNext;
    setSkipNext(false);
    return current;
  };

  return (
    <PathHistoryContext.Provider
      value={{
        history,
        addPath,
        popLatestPath,
        getLatestPath,
        skipNextAdd,
        checkAndReset,
      }}
    >
      {children}
    </PathHistoryContext.Provider>
  );
};

export const usePathHistory = () => {
  const context = useContext(PathHistoryContext);
  if (!context)
    throw new Error("usePathHistory must be used within PathHistoryProvider");
  return context;
};
