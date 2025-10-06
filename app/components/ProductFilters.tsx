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
    <div className="bg-row-white p-6 border-1 border-row-black mb-6">
      <div className="flex flex-wrap gap-6 items-center">
        <div className="flex-1 min-w-[200px]">
          <label className="block font-sans text-caption font-medium text-row-black mb-2 uppercase tracking-wider">
            Price Range (€)
          </label>
          <div className="flex items-center gap-3">
            <input
              type="number"
              placeholder="Min"
              value={priceRange.min || ''}
              onChange={(e) => handlePriceChange('min', e.target.value)}
              className="w-28 px-0 py-2 bg-transparent border-b-2 border-row-black text-row-black placeholder-row-gray-400 focus:outline-none font-sans text-body transition-all duration-400"
              min={minPrice}
              max={priceRange.max || maxPrice}
            />
            <span className="text-row-black">—</span>
            <input
              type="number"
              placeholder="Max"
              value={priceRange.max || ''}
              onChange={(e) => handlePriceChange('max', e.target.value)}
              className="w-28 px-0 py-2 bg-transparent border-b-2 border-row-black text-row-black placeholder-row-gray-400 focus:outline-none font-sans text-body transition-all duration-400"
              min={priceRange.min || minPrice}
              max={maxPrice}
            />
          </div>
        </div>

        <div className="flex-1 min-w-[200px] relative">
          <label className="block font-sans text-caption font-medium text-row-black mb-2 uppercase tracking-wider">
            Size
          </label>
          <button
            onClick={() => setShowSizeDropdown(!showSizeDropdown)}
            className="w-full px-0 py-2 bg-transparent border-b-2 border-row-black text-left text-row-black focus:outline-none flex justify-between items-center font-sans text-body transition-all duration-400"
          >
            <span className="truncate">
              {selectedSizes.length === 0
                ? 'All sizes'
                : selectedSizes.length === 1
                  ? selectedSizes[0]
                  : `${selectedSizes.length} sizes selected`}
            </span>
            <svg className="w-4 h-4 text-row-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showSizeDropdown && (
            <div className="absolute z-10 mt-1 w-full bg-row-white border-1 border-row-black shadow-lg max-h-60 overflow-auto">
              {COMMON_SIZES.map((size) => (
                <label
                  key={size}
                  className="flex items-center px-4 py-3 hover:bg-row-black hover:text-row-white cursor-pointer transition-colors duration-200"
                >
                  <input
                    type="checkbox"
                    checked={selectedSizes.includes(size)}
                    onChange={() => toggleSize(size)}
                    className="w-4 h-4 text-row-black bg-row-white border-row-black focus:ring-row-black"
                  />
                  <span className="ml-3 font-sans text-body-sm">{size}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="px-6 py-2 bg-row-white border-1 border-row-black text-row-black hover:bg-row-black hover:text-row-white transition-all duration-400 font-sans text-caption font-medium uppercase tracking-wider"
          >
            Clear filters
          </button>
        )}
      </div>

      {hasActiveFilters && (
        <div className="mt-4 flex flex-wrap gap-2">
          {priceRange.min !== null && (
            <span className="inline-flex items-center px-3 py-1 bg-row-black text-row-white font-sans text-caption uppercase tracking-wider">
              Min: €{priceRange.min}
            </span>
          )}
          {priceRange.max !== null && (
            <span className="inline-flex items-center px-3 py-1 bg-row-black text-row-white font-sans text-caption uppercase tracking-wider">
              Max: €{priceRange.max}
            </span>
          )}
          {selectedSizes.map((size) => (
            <span key={size} className="inline-flex items-center px-3 py-1 bg-row-black text-row-white font-sans text-caption uppercase tracking-wider">
              Size: {size}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}