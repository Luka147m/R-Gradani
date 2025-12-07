import { useState } from 'react';
import type { ReactNode } from 'react';
import { SearchContext } from './SearchContext';

export const SearchProvider = ({ children }: { children: ReactNode }) => {
  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchActivated, setIsSearchActivated] = useState(false);
  
  // Publisher filter
  const [selectedPublisherIds, setSelectedPublisherIds] = useState<string[]>([]);
  const [publisherQuery, setPublisherQuery] = useState<string>('');
  
  // Openness slider (1-4)
  const [opennessRange, setOpennessRange] = useState<number[]>([1, 4]);
  
  // Acceptance slider (0-1, u postocima)
  const [acceptanceRange, setAcceptanceRange] = useState<number[]>([0, 1]);
  
  // Ignore checkboxes
  const [ignoreSaved, setIgnoreSaved] = useState(false);
  const [ignoreReported, setIgnoreReported] = useState(false);

  const value = {
    searchTerm,
    setSearchTerm,
    isSearchActivated,
    setIsSearchActivated,
    selectedPublisherIds,
    setSelectedPublisherIds,
    publisherQuery,
    setPublisherQuery,
    opennessRange,
    setOpennessRange,
    acceptanceRange,
    setAcceptanceRange,
    ignoreSaved,
    setIgnoreSaved,
    ignoreReported,
    setIgnoreReported,
  };

  return (
    <SearchContext.Provider value={value}>
      {children}
    </SearchContext.Provider>
  );
};

