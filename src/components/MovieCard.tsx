import React from 'react';
import type { DramaBook } from '../types/api.js';

// Extend DramaBook with additional display properties
export interface Drama extends DramaBook {
  category?: string;
  year?: string;
  rating?: number;
  duration?: string;
  genre?: string[];
}

interface MovieCardProps {
  drama: Drama;
  onClick?: () => void;
}

export default function MovieCard({ drama, onClick }: MovieCardProps) {
  return (
    <div 
      className="relative bg-gray-800 rounded-lg overflow-hidden cursor-pointer transform transition-transform hover:scale-105 transition-smooth"
      onClick={onClick}
    >
      {/* Movie Poster */}
      <div className="relative aspect-[3/4] bg-gray-700">
        <img
          src={drama.coverWap || drama.cover || ''}
          alt={drama.bookName}
          className="w-full h-full object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = `https://via.placeholder.com/300x400/374151/ffffff?text=${encodeURIComponent(drama.bookName)}`;
          }}
        />
        
        {/* Play Button Overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
          <div className="w-12 h-12 bg-white bg-opacity-90 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-gray-900 ml-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </div>
        </div>
        
        {/* Duration Badge */}
        <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
          {drama.duration}
        </div>
      </div>
      
      {/* Movie Info */}
      <div className="p-3">
        <h3 className="text-white font-medium text-sm mb-1 line-clamp-2">
          {drama.bookName}
        </h3>
        
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>{drama.category || drama.tags?.[0] || 'Drama'} • {drama.year || '2025'}</span>
          <div className="flex items-center">
            <svg className="w-3 h-3 text-yellow-400 mr-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
            <span>{drama.rating || 4.5}</span>
          </div>
        </div>
      </div>
    </div>
  );
}