import aestheticMatrix from "../../data/vinted/aesthetic-brand-matrix.json";

interface AffordableAlternative {
  name: string;
  matchScore: number;
  sharedKeywords: string[];
  searchTerms: string[];
}

interface LuxuryBrand {
  name: string;
  priceRange: string;
  aestheticKeywords: string[];
  searchTerms: string[];
  affordableAlternatives: AffordableAlternative[];
}

interface AestheticMatrix {
  aesthetic: string;
  aestheticId: string;
  description: string;
  globalSearchKeywords: string[];
  luxuryBrands: LuxuryBrand[];
}

interface MatrixSearchResult {
  aesthetic: string;
  luxuryBrand: string;
  alternatives: AffordableAlternative[];
  aestheticKeywords: string[];
  globalSearchKeywords: string[];
}

export class AestheticMatcher {
  private matrices: AestheticMatrix[];

  constructor() {
    this.matrices = (aestheticMatrix as any).matrices || [];
  }

  /**
   * Find affordable alternatives for a luxury brand
   * @param brandName - Name of luxury brand (e.g., "Rick Owens")
   * @returns Array of alternatives with search terms
   */
  findAlternativesForBrand(brandName: string): MatrixSearchResult[] {
    const results: MatrixSearchResult[] = [];
    const normalizedQuery = brandName.toLowerCase();

    for (const matrix of this.matrices) {
      for (const luxBrand of matrix.luxuryBrands) {
        if (luxBrand.name.toLowerCase().includes(normalizedQuery)) {
          results.push({
            aesthetic: matrix.aesthetic,
            luxuryBrand: luxBrand.name,
            alternatives: luxBrand.affordableAlternatives,
            aestheticKeywords: luxBrand.aestheticKeywords,
            globalSearchKeywords: matrix.globalSearchKeywords,
          });
        }
      }
    }

    return results;
  }

  /**
   * Find alternatives by aesthetic style
   * @param aesthetic - Aesthetic name (e.g., "Avant-Garde", "Y2K")
   * @returns Array of all luxury brands and their alternatives for that aesthetic
   */
  findAlternativesByAesthetic(aesthetic: string): MatrixSearchResult[] {
    const results: MatrixSearchResult[] = [];
    const normalizedAesthetic = aesthetic.toLowerCase();

    const matrix = this.matrices.find(
      (m) =>
        m.aesthetic.toLowerCase() === normalizedAesthetic ||
        m.aestheticId.toLowerCase() === normalizedAesthetic
    );

    if (matrix) {
      for (const luxBrand of matrix.luxuryBrands) {
        results.push({
          aesthetic: matrix.aesthetic,
          luxuryBrand: luxBrand.name,
          alternatives: luxBrand.affordableAlternatives,
          aestheticKeywords: luxBrand.aestheticKeywords,
          globalSearchKeywords: matrix.globalSearchKeywords,
        });
      }
    }

    return results;
  }

  /**
   * Generate Vinted search queries from aesthetic keywords
   * @param aesthetic - Aesthetic name
   * @param includeAlternatives - Include affordable alternative brands
   * @returns Array of optimized search queries
   */
  generateSearchQueries(
    aesthetic: string,
    options?: {
      includeAlternatives?: boolean;
      maxQueries?: number;
      focusBrand?: string; // Focus on specific luxury brand
    }
  ): string[] {
    const queries: string[] = [];
    const brandQueries: string[] = [];
    const matrix = this.matrices.find(
      (m) =>
        m.aesthetic.toLowerCase() === aesthetic.toLowerCase() ||
        m.aestheticId.toLowerCase() === aesthetic.toLowerCase()
    );

    if (!matrix) return queries;

    // Prioritize brand names over keywords for better Vinted results
    for (const luxBrand of matrix.luxuryBrands) {
      if (options?.focusBrand) {
        if (
          luxBrand.name.toLowerCase() !==
          options.focusBrand.toLowerCase()
        ) {
          continue;
        }
      }

      // Add luxury brand name
      brandQueries.push(luxBrand.name);

      // Add affordable alternative brand names (PRIORITY)
      if (options?.includeAlternatives) {
        for (const alt of luxBrand.affordableAlternatives) {
          brandQueries.push(alt.name);
        }
      }
    }

    // Add brand queries first (most effective on Vinted)
    queries.push(...brandQueries);

    // Then add global aesthetic keywords (for discovery)
    queries.push(...matrix.globalSearchKeywords.slice(0, 3));

    // Limit queries if specified
    if (options?.maxQueries) {
      return queries.slice(0, options.maxQueries);
    }

    return queries;
  }

  /**
   * Get all aesthetics available in the matrix
   */
  getAllAesthetics(): Array<{
    id: string;
    name: string;
    description: string;
  }> {
    return this.matrices.map((m) => ({
      id: m.aestheticId,
      name: m.aesthetic,
      description: m.description,
    }));
  }

  /**
   * Decompose a luxury brand into searchable keywords
   * @param brandName - Name of luxury brand
   * @returns Keywords and search terms for finding similar items
   */
  decomposeBrandStyle(brandName: string): {
    brand: string;
    aesthetic: string;
    keywords: string[];
    searchTerms: string[];
    alternatives: string[];
  } | null {
    for (const matrix of this.matrices) {
      for (const luxBrand of matrix.luxuryBrands) {
        if (
          luxBrand.name.toLowerCase() === brandName.toLowerCase()
        ) {
          return {
            brand: luxBrand.name,
            aesthetic: matrix.aesthetic,
            keywords: luxBrand.aestheticKeywords,
            searchTerms: luxBrand.searchTerms,
            alternatives: luxBrand.affordableAlternatives.map(
              (a) => a.name
            ),
          };
        }
      }
    }
    return null;
  }

  /**
   * Smart query expansion: convert user query into multiple search terms
   * @param userQuery - Original user query
   * @returns Expanded queries with alternatives
   */
  expandQuery(userQuery: string): {
    originalQuery: string;
    detectedBrands: string[];
    aestheticKeywords: string[];
    alternativeBrands: string[];
    suggestedSearchTerms: string[];
  } {
    const normalizedQuery = userQuery.toLowerCase();
    const detected: {
      brands: string[];
      keywords: string[];
      alternatives: string[];
      searchTerms: string[];
    } = {
      brands: [],
      keywords: [],
      alternatives: [],
      searchTerms: [],
    };

    // Search for brand mentions in query
    for (const matrix of this.matrices) {
      for (const luxBrand of matrix.luxuryBrands) {
        if (normalizedQuery.includes(luxBrand.name.toLowerCase())) {
          detected.brands.push(luxBrand.name);
          detected.keywords.push(...luxBrand.aestheticKeywords);
          detected.searchTerms.push(...luxBrand.searchTerms);

          // Add affordable alternatives
          for (const alt of luxBrand.affordableAlternatives) {
            detected.alternatives.push(alt.name);
            detected.searchTerms.push(...alt.searchTerms);
          }
        }
      }

      // Check if query mentions aesthetic
      if (
        normalizedQuery.includes(matrix.aesthetic.toLowerCase()) ||
        normalizedQuery.includes(matrix.aestheticId)
      ) {
        detected.keywords.push(...matrix.globalSearchKeywords);
      }
    }

    return {
      originalQuery: userQuery,
      detectedBrands: [...new Set(detected.brands)],
      aestheticKeywords: [...new Set(detected.keywords)],
      alternativeBrands: [...new Set(detected.alternatives)],
      suggestedSearchTerms: [...new Set(detected.searchTerms)],
    };
  }
}

// Export singleton instance
export const aestheticMatcher = new AestheticMatcher();
