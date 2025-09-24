import React from 'react';

interface CategoriesProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

const categories = [
  { id: 'All', name: 'All', active: true },
  { id: 'Drama', name: 'Drama', active: false },
  { id: 'Comedy', name: 'Comedy', active: false },
  { id: 'Action', name: 'Action', active: false },
  { id: 'Romance', name: 'Romance', active: false },
  { id: 'Thriller', name: 'Thriller', active: false },
];

export default function Categories({ selectedCategory, onCategoryChange }: CategoriesProps) {
  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold text-white mb-3">
        Categories
      </h2>
      
      <div className="flex space-x-3 overflow-x-auto pb-2 scrollbar-hide">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => onCategoryChange(category.id)}
            className={`flex-shrink-0 px-6 py-2 rounded-full text-sm font-medium transition-colors ${
              selectedCategory === category.id
                ? 'bg-white text-black'
                : 'bg-gray-700 text-white hover:bg-gray-600'
            }`}
          >
            {category.name}
          </button>
        ))}
      </div>
    </div>
  );
}