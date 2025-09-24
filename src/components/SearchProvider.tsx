import React, { useState, useEffect } from 'react';
import { type Drama } from './MovieCard';

interface SearchContextType {
  searchResults: Drama[];
  isSearching: boolean;
  searchQuery: string;
}

interface SearchProviderProps {
  children: React.ReactNode;
}

const SearchContext = React.createContext<SearchContextType>({
  searchResults: [],
  isSearching: false,
  searchQuery: ''
});

export const useSearch = () => {
  const context = React.useContext(SearchContext);
  if (!context) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
};

export function SearchProvider({ children }: SearchProviderProps) {
  const [searchResults, setSearchResults] = useState<Drama[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const performSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      // Implement search API call here
      const response = await fetch(`/api/proxy/api/search?keyword=${encodeURIComponent(query)}`);
      const data = await response.json();
      
      if (data && data.suggestList) {
        const transformedResults: Drama[] = data.suggestList.map((item: any) => ({
          bookId: item.bookId || '',
          bookName: item.bookName || item.title || 'Unknown Title',
          bookCover: item.bookCover || '',
          category: item.category || 'Drama',
          year: '2025',
          rating: item.rating || 4.5,
          duration: item.duration || '2:00',
          genre: [item.category || 'Drama']
        }));
        setSearchResults(transformedResults);
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      performSearch(searchQuery);
    }, 300); // Debounce search by 300ms

    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  const value = {
    searchResults,
    isSearching,
    searchQuery
  };

  return (
    <SearchContext.Provider value={value}>
      {children}
    </SearchContext.Provider>
  );
}