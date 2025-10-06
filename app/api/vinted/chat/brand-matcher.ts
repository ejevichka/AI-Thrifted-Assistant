// Brand Matcher Service - Finds vibe-alike brands
import brandsClassified from '../../../../data/vinted/brands-classified.json';
import vibeTags from '../../../../data/vinted/vibe-tags.json';

export interface BrandEntry {
  brand: string;
  category: 'Trendy/Designer' | 'Vintage/Affordable';
  vibeTags: string[];
  priceRange: 'low' | 'low-medium' | 'medium' | 'medium-high' | 'high' | 'luxury';
  searchPriority: number;
  matchesTrendy?: string[];
}

export interface VibeMatchResult {
  brand: string;
  category: string;
  matchScore: number;
  sharedTags: string[];
  priceRange: string;
}

export class BrandMatcherService {
  private brands: BrandEntry[];

  constructor() {
    this.brands = brandsClassified.brandDatabase as BrandEntry[];
  }

  /**
   * Find a brand by name (case-insensitive)
   */
  findBrand(brandName: string): BrandEntry | null {
    return this.brands.find(
      b => b.brand.toLowerCase() === brandName.toLowerCase()
    ) || null;
  }

  /**
   * Get all brands in a category
   */
  getBrandsByCategory(category: 'Trendy/Designer' | 'Vintage/Affordable'): BrandEntry[] {
    return this.brands.filter(b => b.category === category);
  }

  /**
   * Calculate match score between two sets of vibe tags
   * Returns a score from 0 to 1
   */
  private calculateMatchScore(tags1: string[], tags2: string[]): number {
    const sharedTags = tags1.filter(tag => tags2.includes(tag));
    const totalUniqueTags = new Set([...tags1, ...tags2]).size;

    if (totalUniqueTags === 0) return 0;

    // Jaccard similarity coefficient
    return sharedTags.length / totalUniqueTags;
  }

  /**
   * Find vibe-alike brands for a given brand name
   * Returns affordable/vintage brands that match the vibe of a trendy/designer brand
   */
  findVibeAlikeBrands(
    brandName: string,
    options: {
      limit?: number;
      minScore?: number;
      category?: 'Vintage/Affordable' | 'all';
    } = {}
  ): VibeMatchResult[] {
    const { limit = 5, minScore = 0.2, category = 'Vintage/Affordable' } = options;

    const sourceBrand = this.findBrand(brandName);
    if (!sourceBrand) {
      console.log(`Brand "${brandName}" not found in database`);
      return [];
    }

    // Get candidate brands to match against
    let candidates = category === 'all'
      ? this.brands.filter(b => b.brand !== brandName)
      : this.getBrandsByCategory(category);

    // Calculate match scores
    const matches = candidates.map(candidate => {
      const matchScore = this.calculateMatchScore(sourceBrand.vibeTags, candidate.vibeTags);
      const sharedTags = sourceBrand.vibeTags.filter(tag => candidate.vibeTags.includes(tag));

      return {
        brand: candidate.brand,
        category: candidate.category,
        matchScore,
        sharedTags,
        priceRange: candidate.priceRange,
        searchPriority: candidate.searchPriority
      };
    });

    // Filter by minimum score and sort by match score and priority
    return matches
      .filter(m => m.matchScore >= minScore)
      .sort((a, b) => {
        // First sort by match score
        if (b.matchScore !== a.matchScore) {
          return b.matchScore - a.matchScore;
        }
        // Then by search priority
        return b.searchPriority - a.searchPriority;
      })
      .slice(0, limit);
  }

  /**
   * Find brands by specific vibe tags
   */
  findBrandsByVibeTags(
    tags: string[],
    options: {
      limit?: number;
      minTagMatch?: number;
      category?: 'Trendy/Designer' | 'Vintage/Affordable' | 'all';
    } = {}
  ): VibeMatchResult[] {
    const { limit = 10, minTagMatch = 1, category = 'all' } = options;

    let candidates = category === 'all'
      ? this.brands
      : this.getBrandsByCategory(category);

    const matches = candidates.map(brand => {
      const sharedTags = tags.filter(tag => brand.vibeTags.includes(tag));
      const matchScore = this.calculateMatchScore(tags, brand.vibeTags);

      return {
        brand: brand.brand,
        category: brand.category,
        matchScore,
        sharedTags,
        priceRange: brand.priceRange
      };
    });

    return matches
      .filter(m => m.sharedTags.length >= minTagMatch)
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, limit);
  }

  /**
   * Generate augmented search queries
   * Takes a user's brand search and adds vibe-alike alternatives
   */
  generateAugmentedSearchQueries(
    brandName: string,
    itemType?: string,
    maxBrands: number = 3
  ): string[] {
    const queries: string[] = [];

    // Always include the original brand
    if (itemType) {
      queries.push(`${brandName} ${itemType}`);
    } else {
      queries.push(brandName);
    }

    // Find vibe-alike brands
    const vibeAlikeBrands = this.findVibeAlikeBrands(brandName, {
      limit: maxBrands,
      minScore: 0.25
    });

    // Add queries for vibe-alike brands
    vibeAlikeBrands.forEach(match => {
      if (itemType) {
        queries.push(`${match.brand} ${itemType}`);
      } else {
        // If no item type, use shared tags as context
        const tagContext = match.sharedTags[0] || '';
        queries.push(`${match.brand} ${tagContext}`);
      }
    });

    return queries;
  }

  /**
   * Get vibe tag information
   */
  getVibeTagInfo(tagName: string): any {
    const allCategories = vibeTags.vibeTagVocabulary;

    for (const [category, tags] of Object.entries(allCategories)) {
      if (tags[tagName as keyof typeof tags]) {
        return {
          tag: tagName,
          category,
          ...tags[tagName as keyof typeof tags]
        };
      }
    }

    return null;
  }

  /**
   * Extract brand names from user query
   */
  extractBrandsFromQuery(query: string): string[] {
    const queryLower = query.toLowerCase();
    const foundBrands: string[] = [];

    for (const brand of this.brands) {
      if (queryLower.includes(brand.brand.toLowerCase())) {
        foundBrands.push(brand.brand);
      }
    }

    return foundBrands;
  }

  /**
   * Get all vibe tags used across all brands
   */
  getAllUsedVibeTags(): { tag: string; count: number }[] {
    const tagCounts = new Map<string, number>();

    this.brands.forEach(brand => {
      brand.vibeTags.forEach(tag => {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      });
    });

    return Array.from(tagCounts.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count);
  }

  /**
   * Recommend brands based on multiple input brands (averaging their vibes)
   */
  recommendBrandsFromMultiple(
    brandNames: string[],
    options: { limit?: number; category?: 'Vintage/Affordable' | 'all' } = {}
  ): VibeMatchResult[] {
    const { limit = 5, category = 'Vintage/Affordable' } = options;

    // Collect all tags from input brands
    const allTags: string[] = [];
    const sourceBrands: BrandEntry[] = [];

    brandNames.forEach(name => {
      const brand = this.findBrand(name);
      if (brand) {
        sourceBrands.push(brand);
        allTags.push(...brand.vibeTags);
      }
    });

    if (sourceBrands.length === 0) return [];

    // Count tag occurrences to find most common vibes
    const tagCounts = new Map<string, number>();
    allTags.forEach(tag => {
      tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
    });

    // Get unique tags weighted by frequency
    const weightedTags = Array.from(tagCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([tag]) => tag);

    // Find brands matching these tags
    return this.findBrandsByVibeTags(weightedTags, {
      limit,
      minTagMatch: Math.min(2, weightedTags.length),
      category
    });
  }
}

// Export singleton instance
export const brandMatcher = new BrandMatcherService();
