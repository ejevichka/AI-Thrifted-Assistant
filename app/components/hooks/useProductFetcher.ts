// hooks/useProductFetcher.ts
import { Product } from '@/app/types';
import { useState, useCallback } from 'react';


interface UseProductFetcherReturn {
  // State
  products: Product[];
  isLoading: boolean;
  error: string | null;
  searchInitiated: boolean;
  
  // Actions
  fetchProducts: (queries: string[]) => Promise<void>;
  clearProducts: () => void;
  clearError: () => void;
}

export const useProductFetcher = (): UseProductFetcherReturn => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchInitiated, setSearchInitiated] = useState(false);

  const fetchProducts = useCallback(async (queries: string[]) => {
    console.log("Starting product fetch with queries:", queries);
    
    setIsLoading(true);
    setSearchInitiated(true);
    setProducts([]);
    setError(null);

    try {
      const response = await fetch('/api/vinted/search-external', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ queries }),
      });

      console.log("Product search response status:", response.status);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to fetch products: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("Product search response data:", data);

      // Check if we have products in the expected format
      if (data && Array.isArray(data.products)) {
        console.log(`Found ${data.products.length} products`);
        setProducts(data.products);
        
        // Log first few products for debugging
        if (data.products.length > 0) {
          console.log("First product example:", data.products[0]);
        }
      } else {
        console.warn("API returned unexpected data format:", data);
        setProducts([]);
        setError("No products found or unexpected response format");
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error fetching products:', error);
      setError(`Failed to fetch products: ${errorMessage}`);
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearProducts = useCallback(() => {
    setProducts([]);
    setSearchInitiated(false);
    setError(null);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    products,
    isLoading,
    error,
    searchInitiated,
    fetchProducts,
    clearProducts,
    clearError,
  };
};