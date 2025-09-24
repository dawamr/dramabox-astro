import React, { useState, useEffect } from 'react';
import Header from './Header';
import TrendingNow from './TrendingNow';
import Categories from './Categories';
import RecommendedSection from './RecommendedSection';
import MovieDetail from './MovieDetail';
import DramaList from './DramaList';
import { type Drama } from './MovieCard';
import { getRecommendedBooks, getDramaList, searchDrama } from '../api/index.js';
import type { DramaBook, SearchResult } from '../types/api.js';

export default function ShortFlixApp() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [dramas, setDramas] = useState<Drama[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDrama, setSelectedDrama] = useState<Drama | null>(null);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [currentView, setCurrentView] = useState<'home' | 'detail'>('home');

  useEffect(() => {
    fetchDramas();
  }, []);

  const fetchDramas = async () => {
    try {
      setLoading(true);
      
      // Fetch real drama data from the API
      const recommendedBooks = await getRecommendedBooks(false);
      
      // Transform API data to our Drama interface
      const transformedDramas: Drama[] = recommendedBooks.map((book: DramaBook) => ({
        ...book,
        category: book.tags?.[0] || book.tagNames?.[0] || 'Drama',
        year: '2025',
        rating: 4.5 + Math.random() * 0.5, // Random rating between 4.5-5.0
        duration: `${Math.floor(Math.random() * 3) + 1}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`,
        genre: book.tags || book.tagNames || ['Drama']
      }));
      
      setDramas(transformedDramas.slice(0, 20)); // Limit to 20 dramas
    } catch (error) {
      console.error('Error fetching dramas:', error);
      // Use fallback mock data
      const mockDramas: Drama[] = [
        {
          bookId: '1',
          bookName: 'Night Chase',
          coverWap: 'https://via.placeholder.com/300x400/374151/ffffff?text=Night+Chase',
          category: 'Action',
          year: '2025',
          rating: 4.8,
          duration: '2:45',
          genre: ['Action', 'Thriller'],
          bookSource: { sceneId: '', expId: '', strategyId: '', strategyName: '', log_id: '' }
        },
        {
          bookId: '2', 
          bookName: 'Love Notes',
          coverWap: 'https://via.placeholder.com/300x400/374151/ffffff?text=Love+Notes',
          category: 'Romance',
          year: '2025',
          rating: 4.6,
          duration: '1:30',
          genre: ['Romance', 'Drama'],
          bookSource: { sceneId: '', expId: '', strategyId: '', strategyName: '', log_id: '' }
        },
        {
          bookId: '3',
          bookName: 'Comic Relief',
          coverWap: 'https://via.placeholder.com/300x400/374151/ffffff?text=Comic+Relief',
          category: 'Comedy',
          year: '2025',
          rating: 4.9,
          duration: '3:12',
          genre: ['Comedy'],
          bookSource: { sceneId: '', expId: '', strategyId: '', strategyName: '', log_id: '' }
        },
        {
          bookId: '4',
          bookName: 'Dark Secrets',
          coverWap: 'https://via.placeholder.com/300x400/374151/ffffff?text=Dark+Secrets',
          category: 'Thriller',
          year: '2025',
          rating: 4.7,
          duration: '2:18',
          genre: ['Thriller', 'Mystery'],
          bookSource: { sceneId: '', expId: '', strategyId: '', strategyName: '', log_id: '' }
        }
      ];
      setDramas(mockDramas);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchResults = (results: SearchResult[]) => {
    setSearchResults(results);
    setIsSearching(results.length > 0);
  };

  const convertSearchResultToDrama = (result: SearchResult): Drama => ({
    ...result,
    category: result.tagNames?.[0] || 'Drama',
    year: '2025',
    rating: 4.5 + Math.random() * 0.5,
    duration: `${Math.floor(Math.random() * 3) + 1}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`,
    genre: result.tagNames || ['Drama'],
    coverWap: result.cover
  });

  // Use search results if searching, otherwise use filtered dramas
  const displayDramas = isSearching 
    ? searchResults.map(convertSearchResultToDrama)
    : dramas.filter(drama => {
        const matchesSearch = drama.bookName.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'All' || drama.category === selectedCategory;
        return matchesSearch && matchesCategory;
      });

  const handleDramaSelect = (drama: Drama) => {
    setSelectedDrama(drama);
    setCurrentView('detail');
  };

  const handleBackToHome = () => {
    setSelectedDrama(null);
    setCurrentView('home');
  };

  // Show detail view if a drama is selected
  if (currentView === 'detail' && selectedDrama) {
    return (
      <MovieDetail 
        drama={selectedDrama} 
        onBack={handleBackToHome}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Header 
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSearchResults={handleSearchResults}
      />
      
      <div className="px-4 pb-4">
        <TrendingNow />
        
        <Categories 
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
        />
        
        <RecommendedSection 
          dramas={displayDramas}
          loading={loading}
          onDramaClick={handleDramaSelect}
        />

        <DramaList 
          onDramaClick={handleDramaSelect}
          category={selectedCategory}
        />
      </div>
    </div>
  );
}