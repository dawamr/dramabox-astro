import React from 'react';

const trendingTags = [
  { id: 1, name: '#Action', color: 'bg-blue-600' },
  { id: 2, name: '#Comedy', color: 'bg-green-600' },
  { id: 3, name: '#Romance', color: 'bg-pink-600' },
  { id: 4, name: '#Thriller', color: 'bg-red-600' },
  { id: 5, name: '#Drama', color: 'bg-purple-600' },
];

export default function TrendingNow() {
  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold text-white mb-3">
        Trending Now
      </h2>
      
      <div className="flex flex-wrap gap-2">
        {trendingTags.map((tag) => (
          <button
            key={tag.id}
            className={`${tag.color} text-white px-4 py-2 rounded-full text-sm font-medium hover:opacity-80 transition-opacity`}
          >
            {tag.name}
          </button>
        ))}
      </div>
    </div>
  );
}