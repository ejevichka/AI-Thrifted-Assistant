// Aesthetic Service Integration
import { AESTHETIC_TAGS, type AestheticTag } from './tags-data';
import { CLASSIFIED_BRANDS, getBrandsByAesthetic, getAestheticsByBrand, type BrandClassification } from './brands-data';

export class AestheticService {
  
  // Find relevant aesthetic tags based on user query
  static findRelevantTags(query: string, limit: number = 3): AestheticTag[] {
    const queryLower = query.toLowerCase();
    
    // Score tags based on relevance
    const scoredTags = AESTHETIC_TAGS.map(tag => {
      let score = 0;
      
      // Exact match on tag name gets highest score
      if (tag.tag_name.toLowerCase() === queryLower) {
        score += 10;
      } else if (tag.tag_name.toLowerCase().includes(queryLower)) {
        score += 8;
      }
      
      // Check alternative names
      if (tag.aka.toLowerCase().includes(queryLower)) {
        score += 6;
      }
      
      // Check keywords
      const keywords = tag.keywords.toLowerCase().split(';');
      keywords.forEach(keyword => {
        if (keyword.includes(queryLower) || queryLower.includes(keyword.trim())) {
          score += 3;
        }
      });
      
      // Check description
      if (tag.description.toLowerCase().includes(queryLower)) {
        score += 2;
      }
      
      return { tag, score };
    })
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
    
    return scoredTags.map(item => item.tag);
  }

  // Extract specific clothing items from query
  static extractClothingItems(query: string): string[] {
    const clothingItems = [
      'dress', 'skirt', 'top', 'shirt', 'blouse', 'sweater', 'hoodie', 'jacket', 'coat',
      'pants', 'jeans', 'trousers', 'shorts', 'shoes', 'boots', 'sneakers', 'bag',
      'accessories', 'jewelry', 'scarf', 'hat', 'belt', 'swimwear', 'lingerie',
      'cardigan', 'blazer', 'suit', 'jumpsuit', 'romper', 't-shirt', 'tank top'
    ];
    
    const queryLower = query.toLowerCase();
    return clothingItems.filter(item => queryLower.includes(item));
  }

  // Generate enhanced context for LLM based on user query
  static generateEnhancedContext(query: string): string {
    const relevantTags = this.findRelevantTags(query, 2);
    const extractedItems = this.extractClothingItems(query);
    
    if (relevantTags.length === 0) {
      return '';
    }

    let context = 'FASHION AESTHETIC GUIDE:\n\n';
    
    for (const tag of relevantTags) {
      const associatedBrands = getBrandsByAesthetic(tag.tag_name);
      const keywordsList = tag.keywords.split(';').slice(0, 8); // Limit keywords
      
      context += `${tag.tag_name.toUpperCase()} AESTHETIC:\n`;
      context += `Style: ${tag.description}\n`;
      context += `Key Items: ${keywordsList.join(', ')}\n`;
      context += `Recommended Brands: ${associatedBrands.slice(0, 6).join(', ')}\n`;
      
      if (tag.aka !== 'N/A') {
        context += `Also Known As: ${tag.aka.replace(';', ', ')}\n`;
      }
      
      context += '\n';
    }

    // Add specific item guidance if items were extracted
    if (extractedItems.length > 0) {
      context += `REQUESTED ITEMS: ${extractedItems.join(', ')}\n`;
      context += 'Focus your search queries on these specific item types.\n\n';
    }

    return context;
  }

  // Generate specific search queries based on aesthetic and items
  static generateSearchQueries(aesthetics: string[], items: string[] = [], limit: number = 5): string[] {
    const queries: string[] = [];
    
    for (const aesthetic of aesthetics) {
      const brands = getBrandsByAesthetic(aesthetic).slice(0, 3); // Top 3 brands per aesthetic
      const aestheticTag = AESTHETIC_TAGS.find(tag => tag.tag_name === aesthetic);
      
      if (!aestheticTag) continue;
      
      const keywords = aestheticTag.keywords.split(';').slice(0, 5);
      
      // If specific items mentioned, use them
      if (items.length > 0) {
        items.forEach(item => {
          // Brand + item combinations
          brands.slice(0, 2).forEach(brand => {
            queries.push(`${brand} ${aesthetic} ${item}`);
          });
        });
      } else {
        // Use keyword items from the aesthetic
        keywords.slice(0, 3).forEach(keyword => {
          brands.slice(0, 2).forEach(brand => {
            queries.push(`${brand} ${keyword.trim()}`);
          });
        });
      }
    }
    
    // Remove duplicates and limit
    return [...new Set(queries)].slice(0, limit);
  }

  // Check if query is asking for moodboard items
  static isMoodboardQuery(query: string): boolean {
    return query.toLowerCase().startsWith('moodboard items with a');
  }

  // Process moodboard request
  static processMoodboardRequest(query: string): string[] {
    const relevantTags = this.findRelevantTags(query, 1);
    const extractedItems = this.extractClothingItems(query);
    
    if (relevantTags.length === 0) {
      return ['vintage aesthetic pieces', 'unique statement items', 'trendy accessories'];
    }

    const aesthetic = relevantTags[0].tag_name;
    return this.generateSearchQueries([aesthetic], extractedItems, 5);
  }

  // Get brand information
  static getBrandInfo(brandName: string): BrandClassification | null {
    return CLASSIFIED_BRANDS.find(brand => 
      brand.brand.toLowerCase() === brandName.toLowerCase()
    ) || null;
  }

  // Get aesthetic information
  static getAestheticInfo(aestheticName: string): AestheticTag | null {
    return AESTHETIC_TAGS.find(tag => 
      tag.tag_name.toLowerCase() === aestheticName.toLowerCase()
    ) || null;
  }
}