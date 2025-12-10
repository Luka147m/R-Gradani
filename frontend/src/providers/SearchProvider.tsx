import { useState } from 'react';
import type { ReactNode } from 'react';
import { SearchContext } from './SearchContext';

export const SearchProvider = ({ children }: { children: ReactNode }) => {

  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchActivated, setIsSearchActivated] = useState(false);
 
  const [selectedPublisherIds, setSelectedPublisherIds] = useState<string[]>([]);
  const [publisherQuery, setPublisherQuery] = useState<string>('');
  

  const [dateRange, setDateRange] = useState<[string, string]>(['', '']);

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
    dateRange,
    setDateRange,
  
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

