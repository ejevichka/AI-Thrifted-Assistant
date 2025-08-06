'use client';

import Image from 'next/image';
import type { Product } from '@/app/types';

interface ProductResultsProps {
  isLoading: boolean;
  error: string | null;
  products: Product[];
  searchInitiated: boolean;
}

export default function ProductResults({ isLoading, error, products, searchInitiated }: ProductResultsProps) {
  if (isLoading) {
    return (
      <div className="text-center text-gray-600 py-8">
        <div className="flex justify-center items-center">
          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Searching for items on Vinted and Depop...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-600 bg-red-100 border border-red-200 p-3 rounded-lg">
        Error: {error}
      </div>
    );
  }
  
  if (searchInitiated && products.length === 0) {
    return (
      <div className="text-center text-gray-500 italic py-8">
        No products found for your search. Try different keywords or another image!
      </div>
    );
  }

  if (products.length > 0) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {products.map((item) => (
          <div key={item.id} className="border border-gray-200 p-4 rounded-lg shadow-sm flex flex-col h-full bg-white transition-shadow hover:shadow-md">
            {/*<div className="relative w-full h-48 mb-3 rounded-md overflow-hidden">
               <Image
                src={item.imageUrl || `https://placehold.co/250x250/E2E8F0/1A202C?text=No+Image`}
                alt={item.title}
                fill
                style={{objectFit: "cover"}}
                className="transition-transform duration-300 hover:scale-105"
              />
            </div> */}
            <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2" title={item.title}>{item.title}</h3>
            {item.brand && <p className="text-sm text-gray-500 mb-1">Brand: {item.brand}</p>}
            {item.size && <p className="text-sm text-gray-500 mb-1">Size: {item.size}</p>}
            <p className="text-purple-600 font-bold text-xl mb-1">{item.price}</p>
            <p className="text-xs text-gray-600 mb-2">Condition: {item.condition}</p>
            <p className="text-xs font-bold text-gray-500 mb-3">{item.platform}</p>
            <a href={item.link} target="_blank" rel="noopener noreferrer" className="mt-auto bg-purple-600 text-white px-4 py-2 rounded-lg text-center text-sm hover:bg-purple-700 transition-colors duration-200">
              View on {item.platform}
            </a>
          </div>
        ))}
      </div>
    );
  }
  
  return (
      <div className="text-center text-gray-500 italic py-8">
          Product results will appear here. Ask the AI or use image search to begin.
      </div>
  );
} 