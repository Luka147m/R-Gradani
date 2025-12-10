import { createContext } from 'react';

interface SearchContextType {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  isSearchActivated: boolean;
  setIsSearchActivated: (active: boolean) => void;
  
  selectedPublisherIds: string[];
  setSelectedPublisherIds: (ids: string[]) => void;
  publisherQuery: string;
  setPublisherQuery: (query: string) => void;
  
  dateRange: [string, string];
  setDateRange: (range: [string, string]) => void;

  ignoreSaved: boolean;
  setIgnoreSaved: (ignore: boolean) => void;
  ignoreReported: boolean;
  setIgnoreReported: (ignore: boolean) => void;
}

export const SearchContext = createContext<SearchContextType | undefined>(undefined);