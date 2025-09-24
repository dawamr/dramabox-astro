import React from 'react';
import MovieCard, { type Drama } from './MovieCard';

interface RecommendedSectionProps {
  dramas: Drama[];
  loading: boolean;
  onDramaClick?: (drama: Drama) => void;
}

export default function RecommendedSection({ dramas, loading, onDramaClick }: RecommendedSectionProps) {
  const handleMovieClick = (drama: Drama) => {
    console.log('Movie clicked:', drama.bookName);
    if (onDramaClick) {
      onDramaClick(drama);
    }
  };

  if (loading) {
    return (
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">
            Recommended for You
          </h2>
          <button className="text-blue-400 text-sm font-medium">
            See All
          </button>
        </div>
        
        <div className="movie-grid">
          {[...Array(4)].map((_, index) => (
            <div key={index} className="bg-gray-800 rounded-lg overflow-hidden animate-pulse">
              <div className="aspect-[3/4] bg-gray-700"></div>
              <div className="p-3">
                <div className="h-4 bg-gray-700 rounded mb-2"></div>
                <div className="h-3 bg-gray-700 rounded w-2/3"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">
          Recommended for You
        </h2>
        <button className="text-blue-400 text-sm font-medium hover:text-blue-300 transition-colors">
          See All
        </button>
      </div>
      
      {dramas.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-400 mb-2">No dramas found</div>
          <div className="text-gray-500 text-sm">Try adjusting your search or category filter</div>
        </div>
      ) : (
        <div className="movie-grid">
          {dramas.map((drama) => (
            <MovieCard
              key={drama.bookId}
              drama={drama}
              onClick={() => handleMovieClick(drama)}
            />
          ))}
        </div>
      )}
    </div>
  );
}