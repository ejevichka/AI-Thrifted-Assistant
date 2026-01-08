'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, X } from 'lucide-react';

export interface VintedFilterState {
  priceRange?: { min: number | null; max: number | null };
  sizes?: string[];
  brands?: string[];
  categories?: string[];
  materials?: string[];
  colors?: string[];
  conditions?: string[];
  order?: 'relevance' | 'newest_first' | 'price_low_to_high' | 'price_high_to_low';
}

interface VintedFiltersProps {
  onFiltersChange: (filters: VintedFilterState) => void;
}

// Common Vinted size IDs (Women's clothing)
const SIZES = [
  { id: '1226', label: 'XXS' },
  { id: '102', label: 'XS' },
  { id: '2', label: 'S' },
  { id: '3', label: 'M' },
  { id: '4', label: 'L' },
  { id: '5', label: 'XL' },
  { id: '6', label: 'XXL' },
];

// Common categories
const CATEGORIES = [
  { id: '1904', label: 'Blazers' },
  { id: '16', label: 'Tops' },
  { id: '1193', label: 'Dresses' },
  { id: '1197', label: 'Jeans' },
  { id: '1203', label: 'Coats & Jackets' },
  { id: '1207', label: 'Sweaters' },
];

// Popular brands
const BRANDS = [
  { id: '10391840', label: 'Zara' },
  { id: '2293', label: 'H&M' },
  { id: '112784', label: 'COS' },
  { id: '67', label: 'Mango' },
  { id: '53', label: 'Arket' },
  { id: '304', label: '& Other Stories' },
];

// Materials (natural fibers for quality)
const MATERIALS = [
  { id: '122', label: 'Wool' },
  { id: '440', label: 'Wool blend' },
  { id: '123', label: 'Cashmere' },
  { id: '44', label: 'Cotton' },
  { id: '303', label: 'Linen' },
  { id: '53', label: 'Silk' },
  { id: '121', label: 'Leather' },
];

// Colors
const COLORS = [
  { id: '1', label: 'Black' },
  { id: '12', label: 'White' },
  { id: '9', label: 'Grey' },
  { id: '4', label: 'Blue' },
  { id: '14', label: 'Beige' },
  { id: '6', label: 'Brown' },
  { id: '3', label: 'Red' },
  { id: '5', label: 'Green' },
];

// Conditions
const CONDITIONS = [
  { id: '6', label: 'New with tags' },
  { id: '1', label: 'New without tags' },
  { id: '2', label: 'Very good' },
  { id: '3', label: 'Good' },
  { id: '4', label: 'Satisfactory' },
];

const SORT_OPTIONS = [
  { value: 'newest_first', label: 'Newest First' },
  { value: 'relevance', label: 'Relevance' },
  { value: 'price_low_to_high', label: 'Price: Low to High' },
  { value: 'price_high_to_low', label: 'Price: High to Low' },
];

export const VintedFilters: React.FC<VintedFiltersProps> = ({ onFiltersChange }) => {
  const [filters, setFilters] = useState<VintedFilterState>({
    order: 'relevance', // Default to relevance for AI-curated searches
    priceRange: { min: null, max: null },
    sizes: [],
    brands: [],
    categories: [],
    materials: [],
    colors: [],
    conditions: [],
  });

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    price: false,
    sort: true,
    sizes: false,
    categories: false,
    brands: false,
    materials: false,
    colors: false,
    conditions: false,
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const updateFilters = (newFilters: Partial<VintedFilterState>) => {
    const updated = { ...filters, ...newFilters };
    setFilters(updated);
    onFiltersChange(updated);
  };

  const toggleArrayFilter = (filterKey: keyof VintedFilterState, value: string) => {
    const currentArray = (filters[filterKey] as string[]) || [];
    const newArray = currentArray.includes(value)
      ? currentArray.filter(v => v !== value)
      : [...currentArray, value];
    updateFilters({ [filterKey]: newArray });
  };

  const clearAllFilters = () => {
    const cleared: VintedFilterState = {
      order: 'newest_first',
      priceRange: { min: null, max: null },
      sizes: [],
      brands: [],
      categories: [],
      materials: [],
      colors: [],
      conditions: [],
    };
    setFilters(cleared);
    onFiltersChange(cleared);
  };

  const hasActiveFilters = () => {
    return (
      (filters.sizes && filters.sizes.length > 0) ||
      (filters.brands && filters.brands.length > 0) ||
      (filters.categories && filters.categories.length > 0) ||
      (filters.materials && filters.materials.length > 0) ||
      (filters.colors && filters.colors.length > 0) ||
      (filters.conditions && filters.conditions.length > 0) ||
      (filters.priceRange && (filters.priceRange.min !== null || filters.priceRange.max !== null))
    );
  };

  const FilterSection = ({
    title,
    section,
    children
  }: {
    title: string;
    section: string;
    children: React.ReactNode;
  }) => (
    <div className="border-b-1 border-row-black">
      <button
        onClick={() => toggleSection(section)}
        className="w-full flex items-center justify-between p-4 hover:bg-row-gray-50 transition-colors"
      >
        <span className="font-medium text-body text-row-black">{title}</span>
        {expandedSections[section] ? (
          <ChevronUp className="w-5 h-5 text-row-black" />
        ) : (
          <ChevronDown className="w-5 h-5 text-row-black" />
        )}
      </button>
      {expandedSections[section] && (
        <div className="p-4 pt-0">
          {children}
        </div>
      )}
    </div>
  );

  const CheckboxGroup = ({
    items,
    selected,
    filterKey
  }: {
    items: Array<{ id: string; label: string }>;
    selected: string[];
    filterKey: keyof VintedFilterState;
  }) => (
    <div className="space-y-2">
      {items.map(item => (
        <label key={item.id} className="flex items-center gap-2 cursor-pointer hover:bg-row-gray-50 p-2 -mx-2">
          <input
            type="checkbox"
            checked={selected.includes(item.id)}
            onChange={() => toggleArrayFilter(filterKey, item.id)}
            className="w-4 h-4 border-2 border-row-black rounded-none"
          />
          <span className="text-body-sm text-row-black">{item.label}</span>
        </label>
      ))}
    </div>
  );

  return (
    <div className="border-2 border-row-black bg-row-white">
      {/* Header */}
      <div className="p-4 border-b-1 border-row-black flex items-center justify-between">
        <h3 className="text-h4 font-sans text-row-black">Filters</h3>
        {hasActiveFilters() && (
          <button
            onClick={clearAllFilters}
            className="text-body-sm text-row-black hover:text-row-gray-700 flex items-center gap-1"
          >
            <X className="w-4 h-4" />
            Clear All
          </button>
        )}
      </div>

      {/* Sort Order */}
      <FilterSection title="Sort By" section="sort">
        <select
          value={filters.order || 'newest_first'}
          onChange={(e) => updateFilters({ order: e.target.value as any })}
          className="w-full border-2 border-row-black p-2 text-body bg-row-white focus:outline-none focus:ring-2 focus:ring-row-black"
        >
          {SORT_OPTIONS.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </FilterSection>

      {/* Price Range */}
      <FilterSection title="Price Range (EUR)" section="price">
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="Min"
            value={filters.priceRange?.min || ''}
            onChange={(e) => updateFilters({
              priceRange: {
                ...filters.priceRange,
                min: e.target.value ? Number(e.target.value) : null
              }
            })}
            className="w-full border-2 border-row-black p-2 text-body bg-row-white focus:outline-none focus:ring-2 focus:ring-row-black"
          />
          <span className="text-row-black">-</span>
          <input
            type="number"
            placeholder="Max"
            value={filters.priceRange?.max || ''}
            onChange={(e) => updateFilters({
              priceRange: {
                ...filters.priceRange,
                max: e.target.value ? Number(e.target.value) : null
              }
            })}
            className="w-full border-2 border-row-black p-2 text-body bg-row-white focus:outline-none focus:ring-2 focus:ring-row-black"
          />
        </div>
      </FilterSection>

      {/* Categories */}
      <FilterSection title="Categories" section="categories">
        <CheckboxGroup
          items={CATEGORIES}
          selected={filters.categories || []}
          filterKey="categories"
        />
      </FilterSection>

      {/* Sizes */}
      <FilterSection title="Sizes" section="sizes">
        <CheckboxGroup
          items={SIZES}
          selected={filters.sizes || []}
          filterKey="sizes"
        />
      </FilterSection>

      {/* Brands */}
      <FilterSection title="Brands" section="brands">
        <CheckboxGroup
          items={BRANDS}
          selected={filters.brands || []}
          filterKey="brands"
        />
      </FilterSection>

      {/* Materials */}
      <FilterSection title="Materials" section="materials">
        <CheckboxGroup
          items={MATERIALS}
          selected={filters.materials || []}
          filterKey="materials"
        />
      </FilterSection>

      {/* Colors */}
      <FilterSection title="Colors" section="colors">
        <CheckboxGroup
          items={COLORS}
          selected={filters.colors || []}
          filterKey="colors"
        />
      </FilterSection>

      {/* Conditions */}
      <FilterSection title="Condition" section="conditions">
        <CheckboxGroup
          items={CONDITIONS}
          selected={filters.conditions || []}
          filterKey="conditions"
        />
      </FilterSection>
    </div>
  );
};
