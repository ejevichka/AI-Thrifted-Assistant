// hooks/useProductFetcher.ts
import { Product } from '@/app/types';
import { useState, useCallback } from 'react';
import { FilterState } from '../ProductFilters';

interface UseProductFetcherReturn {
  // State
  products: Product[];
  isLoading: boolean;
  error: string | null;
  searchInitiated: boolean;
  progressMessage: string | null;

  // Actions
  fetchProducts: (queries: string[], filters?: FilterState, useAiRanker?: boolean, styleId?: string) => Promise<void>;
  clearProducts: () => void;
  clearError: () => void;
}

export const useProductFetcher = (): UseProductFetcherReturn => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchInitiated, setSearchInitiated] = useState(false);
  const [progressMessage, setProgressMessage] = useState<string | null>(null);

  const fetchProducts = useCallback(async (
    queries: string[],
    filters?: FilterState,
    useAiRanker: boolean = false,
    styleId?: string
  ) => {
    console.log("Starting product fetch with queries:", queries);
    console.log("With filters:", filters);
    console.log("AI-Ranker enabled:", useAiRanker);

    setIsLoading(true);
    setSearchInitiated(true);
    setProducts([]);
    setError(null);
    setProgressMessage(null);

    try {
      const response = await fetch('/api/vinted/search-external', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ queries, filters, useAiRanker, styleId }),
      });

      console.log("Product search response status:", response.status);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to fetch products: ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type');

      // ✅ Check if response is SSE stream (AI-Ranker enabled)
      if (contentType?.includes('text/event-stream')) {
        console.log('📡 Receiving SSE stream from AI-Ranker...');

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
          throw new Error('No response stream available');
        }

        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            console.log('✅ SSE stream completed');
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n\n');

          // Keep the last incomplete line in the buffer
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));

                // ✅ Update progress message in real-time!
                if (data.status) {
                  console.log(`🤖 Progress: ${data.status}`);
                  setProgressMessage(data.status);
                }

                // ✅ Final result received
                if (data.complete && data.result) {
                  console.log(`✅ AI-Ranker complete: ${data.result.rankedProducts.length} products`);
                  setProducts(data.result.rankedProducts);
                  setProgressMessage(null);
                }
              } catch (parseError) {
                console.error('Error parsing SSE message:', parseError);
              }
            }
          }
        }
      } else {
        // Standard JSON response (AI-Ranker disabled)
        const data = await response.json();
        console.log("Product search response data:", data);

        if (data && Array.isArray(data.products)) {
          const productCount = data.products.length;
          console.log(`Received ${productCount} products from API`);
          setProducts(data.products);

          if (data.products.length > 0) {
            console.log("First product:", data.products[0]);
          }
        } else {
          console.warn("API returned unexpected data format:", data);
          setProducts([]);
          setError("No products found or unexpected response format");
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error fetching products:', error);
      setError(`Failed to fetch products: ${errorMessage}`);
      setProducts([]);
      setProgressMessage(null);
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
    progressMessage,
    fetchProducts,
    clearProducts,
    clearError,
  };
};