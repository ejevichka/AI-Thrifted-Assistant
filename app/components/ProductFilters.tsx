'use client';

import { useState } from 'react';

interface ProductFiltersProps {
  onFiltersChange: (filters: FilterState) => void;
  minPrice?: number;
  maxPrice?: number;
}

export interface FilterState {
  priceRange: {
    min: number | null;
    max: number | null;
  };
  sizes: string[];
}

const COMMON_SIZES = [
  'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL',
  '34', '36', '38', '40', '42', '44', '46', '48',
  'One Size', 'Universal'
];

export default function ProductFilters({ 
  onFiltersChange, 
  minPrice = 0, 
  maxPrice = 500 
}: ProductFiltersProps) {
  const [priceRange, setPriceRange] = useState<{ min: number | null; max: number | null }>({
    min: null,
    max: null
  });
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [showSizeDropdown, setShowSizeDropdown] = useState(false);

  const handlePriceChange = (type: 'min' | 'max', value: string) => {
    const numValue = value === '' ? null : Number(value);
    const newPriceRange = { ...priceRange, [type]: numValue };
    setPriceRange(newPriceRange);
    onFiltersChange({ priceRange: newPriceRange, sizes: selectedSizes });
  };

  const toggleSize = (size: string) => {
    const newSizes = selectedSizes.includes(size)
      ? selectedSizes.filter(s => s !== size)
      : [...selectedSizes, size];
    setSelectedSizes(newSizes);
    onFiltersChange({ priceRange, sizes: newSizes });
  };

  const clearFilters = () => {
    setPriceRange({ min: null, max: null });
    setSelectedSizes([]);
    onFiltersChange({ priceRange: { min: null, max: null }, sizes: [] });
  };

  const hasActiveFilters = priceRange.min !== null || priceRange.max !== null || selectedSizes.length > 0;

  return (
    <div className="bg-[#23232b] p-4 rounded-lg shadow-sm mb-4">
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Price Range (€)
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              placeholder="Min"
              value={priceRange.min || ''}
              onChange={(e) => handlePriceChange('min', e.target.value)}
              className="w-24 px-3 py-1.5 bg-[#18181b] border border-gray-600 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
              min={minPrice}
              max={priceRange.max || maxPrice}
            />
            <span className="text-gray-400">-</span>
            <input
              type="number"
              placeholder="Max"
              value={priceRange.max || ''}
              onChange={(e) => handlePriceChange('max', e.target.value)}
              className="w-24 px-3 py-1.5 bg-[#18181b] border border-gray-600 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
              min={priceRange.min || minPrice}
              max={maxPrice}
            />
          </div>
        </div>

        <div className="flex-1 min-w-[200px] relative">
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Size
          </label>
          <button
            onClick={() => setShowSizeDropdown(!showSizeDropdown)}
            className="w-full px-3 py-1.5 bg-[#18181b] border border-gray-600 rounded-md text-left text-white focus:outline-none focus:ring-2 focus:ring-purple-500 flex justify-between items-center"
          >
            <span className="truncate">
              {selectedSizes.length === 0 
                ? 'All sizes' 
                : selectedSizes.length === 1 
                  ? selectedSizes[0]
                  : `${selectedSizes.length} sizes selected`}
            </span>
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {showSizeDropdown && (
            <div className="absolute z-10 mt-1 w-full bg-[#23232b] border border-gray-600 rounded-md shadow-lg max-h-60 overflow-auto">
              {COMMON_SIZES.map((size) => (
                <label
                  key={size}
                  className="flex items-center px-3 py-2 hover:bg-[#2a2a35] cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedSizes.includes(size)}
                    onChange={() => toggleSize(size)}
                    className="w-4 h-4 text-purple-600 bg-[#18181b] border-gray-600 rounded focus:ring-purple-500"
                  />
                  <span className="ml-2 text-white text-sm">{size}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="px-4 py-1.5 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors text-sm"
          >
            Clear filters
          </button>
        )}
      </div>

      {hasActiveFilters && (
        <div className="mt-3 flex flex-wrap gap-2">
          {priceRange.min !== null && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-900/30 text-purple-300 border border-purple-700">
              Min: €{priceRange.min}
            </span>
          )}
          {priceRange.max !== null && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-900/30 text-purple-300 border border-purple-700">
              Max: €{priceRange.max}
            </span>
          )}
          {selectedSizes.map((size) => (
            <span key={size} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-900/30 text-purple-300 border border-purple-700">
              Size: {size}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}