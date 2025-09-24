import { useState, useEffect, useRef, useCallback } from 'react';
import { getDramaList } from '../api/index.js';
import type { DramaBook } from '../types/api.js';
import MovieCard, { type Drama } from './MovieCard.tsx';

interface DramaListProps {
  onDramaClick?: (drama: Drama) => void;
  category?: string;
  className?: string;
}

interface ColumnData {
  title: string;
  bookList: DramaBook[];
}

export default function DramaList({ onDramaClick, category, className = '' }: DramaListProps) {
  const [dramas, setDramas] = useState<Drama[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [hasPrevPage, setHasPrevPage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const loadingRef = useRef(false); // Prevent multiple simultaneous requests

  // Convert DramaBook to Drama with additional display properties
  const convertToDisplayDrama = (book: DramaBook): Drama => ({
    ...book,
    category: book.tags?.[0] || 'Drama',
    year: '2024',
    rating: 4.0 + Math.random() * 1, // Random rating between 4.0-5.0
    duration: `${Math.floor(Math.random() * 60) + 90}m`, // Random duration 90-150 minutes
    genre: book.tags || ['Drama']
  });

  // Load dramas for a specific page
  const loadDramas = useCallback(async (pageNumber: number) => {
    if (loadingRef.current) {
      console.log(`⏳ Request already in progress, skipping page ${pageNumber}`);
      return;
    }
    
    try {
      loadingRef.current = true;
      setLoading(true);
      setError(null);
      
      console.log(`📥 Loading dramas for page ${pageNumber}...`);
      // Convert to 0-based index for API call (API expects 0-based)
      const columnData: ColumnData[] = await getDramaList(pageNumber - 1, false);
      
      // Flatten all books from all columns
      const allBooks: DramaBook[] = columnData.flatMap(column => column.bookList);
      console.log(`📚 Raw books received:`, allBooks.length);
      
      // Convert to display format
      const newDramas = allBooks.map(convertToDisplayDrama);
      
      // Filter by category if specified
      const filteredDramas = category && category !== 'All'
        ? newDramas.filter(drama => 
            drama.category?.toLowerCase().includes(category.toLowerCase()) ||
            drama.tags?.some(tag => tag.toLowerCase().includes(category.toLowerCase()))
          )
        : newDramas;
      
      console.log(`✅ Filtered dramas:`, filteredDramas.length);
      
      // Set the dramas for current page (replace, don't append)
      setDramas(filteredDramas);
      
      // Update pagination states
      setHasPrevPage(pageNumber > 1);
      setHasNextPage(allBooks.length > 0); // Assume has next page if we got results
      
      // If we got fewer dramas than expected, we might be at the end
      if (allBooks.length < 5) {
        console.log(`🏁 Might be near end - got ${allBooks.length} books`);
        setHasNextPage(false);
      }
      
    } catch (err) {
      console.error('❌ Error loading dramas:', err);
      setError('Failed to load dramas. Please try again.');
      setHasNextPage(false);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [category]);

  // Pagination functions
  const handleNextPage = useCallback(() => {
    if (!hasNextPage || loadingRef.current) {
      console.log(`⏹️ Skipping next page: hasNextPage=${hasNextPage}, loading=${loadingRef.current}`);
      return;
    }
    
    const nextPage = currentPage + 1;
    console.log(`📈 Going to next page: ${nextPage}`);
    setCurrentPage(nextPage);
    loadDramas(nextPage);
  }, [hasNextPage, currentPage, loadDramas]);

  const handlePrevPage = useCallback(() => {
    if (!hasPrevPage || loadingRef.current) {
      console.log(`⏹️ Skipping prev page: hasPrevPage=${hasPrevPage}, loading=${loadingRef.current}`);
      return;
    }
    
    const prevPage = currentPage - 1;
    console.log(`📉 Going to previous page: ${prevPage}`);
    setCurrentPage(prevPage);
    loadDramas(prevPage);
  }, [hasPrevPage, currentPage, loadDramas]);

  // Load initial dramas when component mounts or category changes
  useEffect(() => {
    console.log(`🚀 Initial load triggered - category: ${category}`);
    
    // Reset all states
    setDramas([]);
    setCurrentPage(1);
    setHasNextPage(true);
    setHasPrevPage(false);
    setError(null);
    loadingRef.current = false;
    
    // Load first page
    loadDramas(1);
  }, [category, loadDramas]);

  // Handle drama click
  const handleDramaClick = (drama: Drama) => {
    if (onDramaClick) {
      onDramaClick(drama);
    }
  };

  // Loading skeleton component
  const LoadingSkeleton = () => (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {Array.from({ length: 12 }).map((_, index) => (
        <div key={index} className="animate-pulse">
          <div className="bg-gray-700 aspect-[3/4] rounded-lg mb-3"></div>
          <div className="bg-gray-600 h-4 rounded mb-2"></div>
          <div className="bg-gray-600 h-3 rounded w-3/4"></div>
        </div>
      ))}
    </div>
  );

  if (error && dramas.length === 0) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="text-center text-red-400">
          <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-lg font-medium mb-2">Failed to Load Dramas</p>
          <p className="text-gray-400 mb-4">{error}</p>
          <button 
            onClick={() => {
              setError(null);
              setCurrentPage(1);
              setHasNextPage(true);
              setHasPrevPage(false);
              loadingRef.current = false;
              loadDramas(1);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 ${className}`}>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">
          {category && category !== 'All' ? `${category} Dramas` : 'All Dramas'}
        </h2>
        <p className="text-gray-400">
          {dramas.length > 0 && `${dramas.length} drama${dramas.length !== 1 ? 's' : ''} found`}
        </p>
      </div>

      {/* Drama Grid */}
      {dramas.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 mb-8">
          {dramas.map((drama, index) => (
            <div key={`${drama.bookId}-${index}`}>
              <MovieCard
                drama={drama}
                onClick={() => handleDramaClick(drama)}
              />
            </div>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {dramas.length > 0 && (hasPrevPage || hasNextPage) && (
        <div className="flex justify-center items-center space-x-4 py-6">
          <button
            onClick={handlePrevPage}
            disabled={!hasPrevPage || loading}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              hasPrevPage && !loading
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
            }`}
          >
            Previous
          </button>
          
          <span className="text-gray-400 font-medium">
            Page {currentPage}
          </span>
          
          <button
            onClick={handleNextPage}
            disabled={!hasNextPage || loading}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              hasNextPage && !loading
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
            }`}
          >
            Next
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="mt-8">
          {dramas.length === 0 ? (
            <LoadingSkeleton />
          ) : (
            <div className="flex justify-center items-center py-8">
              <div className="flex items-center space-x-2 text-gray-400">
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                <span>Loading dramas...</span>
              </div>
            </div>
          )}
        </div>
      )}


      {/* Empty State */}
      {!loading && dramas.length === 0 && !error && (
        <div className="text-center py-12">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2M7 4h10l1 16H6L7 4z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v4m0 4h.01" />
          </svg>
          <h3 className="text-xl font-medium text-gray-400 mb-2">No Dramas Found</h3>
          <p className="text-gray-500">
            {category && category !== 'All' 
              ? `No dramas found in the "${category}" category.`
              : 'No dramas available at the moment.'
            }
          </p>
        </div>
      )}
    </div>
  );
}