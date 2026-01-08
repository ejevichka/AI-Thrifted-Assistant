import { useState, useCallback } from 'react';

export interface VibeDNASearchParams {
  // Single style search
  style_id?: string;

  // Multi-style search (weighted)
  style_weights?: Record<string, number>; // e.g., { "y2k": 0.8, "grunge": 0.5 }

  // Brand similarity search
  brand_name?: string;

  // Search parameters
  limit?: number;
  min_similarity?: number;
}

export interface VibeDNAResult {
  entity_name: string;
  similarity: number;
  shared_styles?: string[];
  metadata?: {
    top_styles: Array<{ style: string; score: number }>;
    average_score: number;
  };
}

export interface VibeDNASearchResponse {
  results: VibeDNAResult[];
  count: number;
  query: VibeDNASearchParams;
}

/**
 * Hook for VibeDNA vector search
 *
 * Usage examples:
 *
 * 1. Find Y2K brands:
 *    const { searchByStyle } = useVibeDNASearch();
 *    const brands = await searchByStyle('y2k', 20);
 *
 * 2. Multi-style search:
 *    const { searchByStyles } = useVibeDNASearch();
 *    const brands = await searchByStyles({ y2k: 0.8, grunge: 0.5 }, 20);
 *
 * 3. Find similar brands:
 *    const { searchSimilarBrands } = useVibeDNASearch();
 *    const brands = await searchSimilarBrands('Rick Owens', 10);
 */
export function useVibeDNASearch() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResults, setLastResults] = useState<VibeDNAResult[]>([]);

  /**
   * Search brands by single style
   * @param styleId - Style identifier (e.g., 'y2k', 'goth', 'techwear')
   * @param limit - Maximum number of results (default: 20)
   * @param minSimilarity - Minimum similarity threshold (default: 0.3)
   */
  const searchByStyle = useCallback(async (
    styleId: string,
    limit: number = 20,
    minSimilarity: number = 0.3
  ): Promise<VibeDNAResult[]> => {
    console.log(`🧬 VibeDNA: Searching for style "${styleId}"`, {
      limit,
      minSimilarity
    });

    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        style_id: styleId,
        limit: limit.toString(),
        min_similarity: minSimilarity.toString()
      });

      const response = await fetch(`/api/diggy/search-by-vibe?${params}`);

      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`);
      }

      const data: VibeDNASearchResponse = await response.json();

      console.log(`✅ VibeDNA: Found ${data.results.length} brands for "${styleId}":`);
      console.table(data.results.map(r => ({
        brand: r.entity_name,
        similarity: r.similarity.toFixed(3),
        sharedStyles: r.shared_styles?.join(', ') || 'N/A'
      })));

      setLastResults(data.results);
      return data.results;
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to search brands';
      setError(errorMsg);
      console.error('❌ VibeDNA search error:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Search brands by multiple styles with weights
   * @param styleWeights - Object with style IDs and weights (e.g., { "y2k": 0.8, "grunge": 0.5 })
   * @param limit - Maximum number of results (default: 20)
   * @param minSimilarity - Minimum similarity threshold (default: 0.3)
   */
  const searchByStyles = useCallback(async (
    styleWeights: Record<string, number>,
    limit: number = 20,
    minSimilarity: number = 0.3
  ): Promise<VibeDNAResult[]> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/diggy/search-by-vibe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          style_weights: styleWeights,
          limit,
          min_similarity: minSimilarity
        })
      });

      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`);
      }

      const data: VibeDNASearchResponse = await response.json();
      setLastResults(data.results);
      return data.results;
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to search brands';
      setError(errorMsg);
      console.error('VibeDNA search error:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Find brands similar to a given brand
   * @param brandName - Brand name to find similar brands for
   * @param limit - Maximum number of results (default: 10)
   * @param minSimilarity - Minimum similarity threshold (default: 0.5)
   */
  const searchSimilarBrands = useCallback(async (
    brandName: string,
    limit: number = 10,
    minSimilarity: number = 0.5
  ): Promise<VibeDNAResult[]> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/diggy/search-by-vibe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand_name: brandName,
          limit,
          min_similarity: minSimilarity
        })
      });

      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`);
      }

      const data: VibeDNASearchResponse = await response.json();
      setLastResults(data.results);
      return data.results;
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to search brands';
      setError(errorMsg);
      console.error('VibeDNA search error:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Convert VibeDNA results to Vinted search queries (brand names)
   * @param results - VibeDNA search results
   * @param maxQueries - Maximum number of queries to generate (default: 10)
   */
  const resultsToSearchQueries = useCallback((
    results: VibeDNAResult[],
    maxQueries: number = 10
  ): string[] => {
    return results
      .slice(0, maxQueries)
      .map(result => result.entity_name);
  }, []);

  /**
   * All-in-one: Search by style and convert to Vinted queries
   * @param styleId - Style identifier
   * @param limit - Number of brands to fetch (default: 10)
   */
  const getStyleBrandQueries = useCallback(async (
    styleId: string,
    limit: number = 10
  ): Promise<string[]> => {
    const results = await searchByStyle(styleId, limit, 0.3);
    return resultsToSearchQueries(results, limit);
  }, [searchByStyle, resultsToSearchQueries]);

  return {
    // Core search functions
    searchByStyle,
    searchByStyles,
    searchSimilarBrands,

    // Utility functions
    resultsToSearchQueries,
    getStyleBrandQueries,

    // State
    isLoading,
    error,
    lastResults
  };
}
