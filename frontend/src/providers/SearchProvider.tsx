import { useState } from 'react';
import type { ReactNode } from 'react';
import { SearchContext } from './SearchContext';
import { useLocalStorage } from '../hooks/useLocalStorage';

export const SearchProvider = ({ children }: { children: ReactNode }) => {

  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchActivated, setIsSearchActivated] = useState(false);
 
  const [selectedPublisherIds, setSelectedPublisherIds] = useState<string[]>([]);
  const [publisherQuery, setPublisherQuery] = useState<string>('');
  

  const [dateRange, setDateRange] = useState<[string, string]>(['', '']);

  const [ignoreSaved, setIgnoreSaved] = useState(false);
  const [ignoreReported, setIgnoreReported] = useState(false);


  const [includeSaved, setIncludeSavedLocal] = useLocalStorage('includeSaved', 'true');
  const [includeUnprocessed, setIncludeUnprocessedLocal] = useLocalStorage('includeUnprocessed', 'true');

  const setIncludeSaved = (value: boolean) => {
    setIncludeSavedLocal(String(value));
  };

  const setIncludeUnprocessed = (value: boolean) => {
    setIncludeUnprocessedLocal(String(value));
  };

  // Konvertuj string vrijednosti u boolean za korištenje
  const includeSavedBool = includeSaved === 'true';
  const includeUnprocessedBool = includeUnprocessed === 'true';

  const value = {
    searchTerm,
    setSearchTerm,
    isSearchActivated,
    setIsSearchActivated,
    selectedPublisherIds,
    setSelectedPublisherIds,
    publisherQuery,
    setPublisherQuery,
    dateRange,
    setDateRange,
  
    ignoreSaved,
    setIgnoreSaved,
    ignoreReported,
    setIgnoreReported,

    includeSaved: includeSavedBool,
    setIncludeSaved,
    includeUnprocessed: includeUnprocessedBool,
    setIncludeUnprocessed,
  };

  return (
    <SearchContext.Provider value={value}>
      {children}
    </SearchContext.Provider>
  );
};

