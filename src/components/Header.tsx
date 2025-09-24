import React from 'react';
import { searchDrama } from '../api/index.js';
import type { SearchResult } from '../types/api.js';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSearchResults?: (results: SearchResult[]) => void;
}

export default function Header({ searchQuery, onSearchChange, onSearchResults }: HeaderProps) {
  const handleSearch = async (query: string) => {
    onSearchChange(query);
    
    if (query.trim() && onSearchResults) {
      try {
        const results = await searchDrama(query);
        onSearchResults(results);
      } catch (error) {
        console.error('Search error:', error);
        onSearchResults([]);
      }
    } else if (onSearchResults) {
      onSearchResults([]);
    }
  };
  return (
    <div className="bg-black p-4 sticky top-0 z-50">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-white rounded flex items-center justify-center">
            <div className="w-6 h-6 bg-black rounded-sm flex items-center justify-center">
              <span className="text-white text-xs font-bold">S</span>
            </div>
          </div>
          <h1 className="text-xl font-bold text-white">ShortFlix</h1>
        </div>
        
        <div className="flex items-center space-x-3">
          <button className="p-2 hover:bg-gray-800 rounded-full transition-colors">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zm-2 2h-2a2 2 0 01-2-2V7a2 2 0 012-2h7a2 2 0 012 2v3" />
            </svg>
          </button>
          <button className="p-2 hover:bg-gray-800 rounded-full transition-colors">
            <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          </button>
        </div>
      </div>
      
      <div className="relative">
        <div className="flex items-center bg-gray-800 rounded-full px-4 py-3">
          <svg className="w-5 h-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search short movies..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="flex-1 bg-transparent text-white placeholder-gray-400 outline-none"
          />
          <button className="ml-3 p-1 hover:bg-gray-700 rounded transition-colors">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}