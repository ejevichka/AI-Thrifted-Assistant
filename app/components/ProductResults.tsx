'use client';

import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import type { Product } from '@/app/types';

interface ProductResultsProps {
  isLoading: boolean;
  error: string | null;
  products: Product[];
  searchInitiated: boolean;
}

const ITEMS_PER_PAGE = 50; // Show 50 items initially and load 50 more on scroll

export default function ProductResults({ isLoading, error, products, searchInitiated }: ProductResultsProps) {
  const [displayedCount, setDisplayedCount] = useState(ITEMS_PER_PAGE);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const observerTarget = useRef<HTMLDivElement>(null);

  // Reset displayed count when products change
  useEffect(() => {
    setDisplayedCount(ITEMS_PER_PAGE);
  }, [products]);

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoadingMore && displayedCount < products.length) {
          setIsLoadingMore(true);
          // Simulate loading delay for smooth UX
          setTimeout(() => {
            setDisplayedCount(prev => Math.min(prev + ITEMS_PER_PAGE, products.length));
            setIsLoadingMore(false);
          }, 300);
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [displayedCount, products.length, isLoadingMore]);

  if (isLoading) {
    return (
      <div className="text-center text-row-gray-500 py-16">
        <div className="flex justify-center items-center">
          <svg className="animate-spin -ml-1 mr-3 h-6 w-6 text-row-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="font-sans text-body">Searching for items on Vinted...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-row-accent bg-row-cream-50 border-1 border-row-accent p-6">
        <p className="font-sans text-body">Error: {error}</p>
      </div>
    );
  }

  if (searchInitiated && products.length === 0) {
    return (
      <div className="text-center text-row-gray-500 py-16">
        <p className="font-sans text-body">No products found for your search. Try different keywords or filters!</p>
      </div>
    );
  }

  if (products.length > 0) {
    const displayedProducts = products.slice(0, displayedCount);
    const hasMore = displayedCount < products.length;

    return (
      <>
        {/* Product count info */}
        <div className="mb-4 text-body-sm text-row-gray-600">
          Showing {displayedProducts.length} of {products.length} items
        </div>

        {/* Product grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {displayedProducts.map((item) => (
            <div key={item.id} className="border-1 border-row-black p-0 flex flex-col h-full bg-row-white transition-all duration-400 hover:shadow-lg group">
              <div className="relative w-full aspect-product mb-4 overflow-hidden">
                <Image
                  src={item.imageUrl || `https://placehold.co/250x250/E2E8F0/1A202C?text=No+Image`}
                  alt={item.title}
                  fill
                  style={{objectFit: "cover"}}
                  className="transition-transform duration-600 group-hover:scale-105"
                />
              </div>
              <div className="px-4 pb-4 flex flex-col flex-1">
                <h3 className="font-sans text-body-sm font-medium text-row-black mb-2 line-clamp-2 uppercase tracking-wide" title={item.title}>{item.title}</h3>
                {item.brand && <p className="text-caption text-row-gray-600 mb-1 uppercase tracking-wider">Brand: {item.brand}</p>}
                {item.size && <p className="text-caption text-row-gray-600 mb-1 uppercase tracking-wider">Size: {item.size}</p>}
                <p className="text-row-black font-serif text-h4 mb-1">{item.price}</p>
                <p className="text-caption text-row-gray-500 mb-1 uppercase tracking-wider">Condition: {item.condition}</p>
                <p className="text-caption font-medium text-row-gray-700 mb-4 uppercase tracking-wider">{item.platform}</p>
                <a href={item.link} target="_blank" rel="noopener noreferrer" className="mt-auto bg-row-black text-row-white px-6 py-3 text-center text-caption font-medium uppercase tracking-wider hover:bg-row-gray-800 transition-all duration-400">
                  View on {item.platform}
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* Infinite scroll trigger & loading indicator */}
        {hasMore && (
          <div ref={observerTarget} className="py-8 text-center">
            {isLoadingMore && (
              <div className="flex justify-center items-center">
                <svg className="animate-spin h-6 w-6 text-row-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="ml-3 text-body-sm text-row-gray-600">Loading more items...</span>
              </div>
            )}
          </div>
        )}

        {/* End of results message */}
        {!hasMore && products.length > ITEMS_PER_PAGE && (
          <div className="py-8 text-center text-body-sm text-row-gray-600">
            You've reached the end of the results
          </div>
        )}
      </>
    );
  }

  return (
    <div className="text-center text-row-gray-500 py-16">
      <p className="font-sans text-body">Product results will appear here. Ask the AI or use image search to begin.</p>
    </div>
  );
}
