import { NextRequest, NextResponse } from "next/server";

interface ScrapedItem {
    id: string;
    title: string;
    price: string;
    priceNumeric?: number;
    imageUrl: string;
    condition: string;
    link: string;
    platform: "Vinted" | "Depop";
    brand: string;
    size: string;
    photo: string;
}

interface VintedFilters {
    priceRange?: { min: number | null; max: number | null };
    sizes?: string[];
    brands?: string[];
    categories?: string[];
    materials?: string[];
    colors?: string[];
    conditions?: string[];
    order?: 'relevance' | 'newest_first' | 'price_low_to_high' | 'price_high_to_low';
}

// Helper function to simulate a call to a Depop scraper
/* async function searchDepop(query: string): Promise<any[]> {
  console.log(`Simulating search on Depop for: "${query}"`);
  // Returning mock data for demonstration
  return [
    {
      id: `depop_${Math.random().toString(36).substr(2, 9)}`,
      title: `${query}`,
      price: "25.00",
      imageUrl: "https://placehold.co/250x250/7C3AED/FFFFFF?text=Depop+Item",
      condition: "Used - good",
      link: `https://www.depop.com/search/?q=${encodeURIComponent(query)}`,
      platform: "Depop",
      brand: "Vintage",
      size: "Large",
    },
  ];
}
 */
/**
 * Build Vinted API URL with advanced filters
 * Based on URL pattern: catalog?search_text=...&catalog[]=...&size_ids[]=...&brand_ids[]=...
 */
function buildVintedUrl(query: string, filters?: VintedFilters): string {
    const cleanedQuery = query.replace(/\n/g, " ").replace(/, let me find some great options for you!/g, "").trim();

    const params = new URLSearchParams();
    params.append('page', '1');
    params.append('per_page', '50'); // 50 items per query for good initial load
    params.append('search_text', cleanedQuery);

    // Order/Sort
    const orderMap: Record<string, string> = {
        'newest_first': 'newest_first',
        'price_low_to_high': 'price_low_to_high',
        'price_high_to_low': 'price_high_to_low',
        'relevance': 'relevance'
    };
    params.append('order', orderMap[filters?.order || 'newest_first'] || 'newest_first');

    // Price Range
    if (filters?.priceRange) {
        if (filters.priceRange.min !== null && filters.priceRange.min !== undefined) {
            params.append('price_from', filters.priceRange.min.toString());
        }
        if (filters.priceRange.max !== null && filters.priceRange.max !== undefined) {
            params.append('price_to', filters.priceRange.max.toString());
        }
        params.append('currency', 'EUR');
    }

    // Categories (catalog[])
    // ALWAYS filter by clothing & accessories categories to avoid toys, home items, etc.
    const clothingCategories = ['1953', '16', '12', '15', '13', '14', '18', '1904'];

    if (filters?.categories && filters.categories.length > 0) {
        // Use user-provided categories
        filters.categories.forEach(cat => {
            params.append('catalog[]', cat);
        });
    } else {
        // Default: add all clothing & accessory categories
        clothingCategories.forEach(cat => {
            params.append('catalog[]', cat);
        });
    }

    // Sizes (size_ids[])
    if (filters?.sizes && filters.sizes.length > 0) {
        filters.sizes.forEach(size => {
            params.append('size_ids[]', size);
        });
    }

    // Brands (brand_ids[])
    if (filters?.brands && filters.brands.length > 0) {
        filters.brands.forEach(brand => {
            params.append('brand_ids[]', brand);
        });
    }

    // Materials (material_ids[])
    if (filters?.materials && filters.materials.length > 0) {
        filters.materials.forEach(material => {
            params.append('material_ids[]', material);
        });
    }

    // Colors (color_ids[])
    if (filters?.colors && filters.colors.length > 0) {
        filters.colors.forEach(color => {
            params.append('color_ids[]', color);
        });
    }

    // Conditions (status_ids[])
    if (filters?.conditions && filters.conditions.length > 0) {
        filters.conditions.forEach(condition => {
            params.append('status_ids[]', condition);
        });
    }

    return `https://www.vinted.de/api/v2/catalog/items?${params.toString()}`;
}

async function searchVinted(query: string, filters?: VintedFilters): Promise<ScrapedItem[]> {
  const cleanedQuery = query.replace(/\n/g, " ").replace(/, let me find some great options for you!/g, "").trim();
  console.log(`Searching Vinted for: "${cleanedQuery}"`, filters ? `with filters: ${JSON.stringify(filters)}` : '');

  const maxRetries = 3;
  const baseDelay = 5000;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
          console.log(`Attempt ${attempt}/${maxRetries} for query: "${cleanedQuery}"`);

          const url = buildVintedUrl(cleanedQuery, filters);
          console.log("HERERERRE", url)
          
          // Fetch cookies with improved headers
          console.log("Fetching cookies from Vinted homepage...");
          const cookieHeaders = {
              "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
              "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
              "Accept-Language": "en-US,en;q=0.9,de;q=0.8",
              "Accept-Encoding": "gzip, deflate, br",
              "Cache-Control": "no-cache",
              "Pragma": "no-cache",
              "Sec-Fetch-Dest": "document",
              "Sec-Fetch-Mode": "navigate",
              "Sec-Fetch-Site": "none",
              "Sec-Fetch-User": "?1",
              "Upgrade-Insecure-Requests": "1"
          };

          const mainPageResponse = await fetch("https://www.vinted.de/", { 
              headers: cookieHeaders,
              redirect: 'follow'
          });
          
          if (!mainPageResponse.ok) {
              throw new Error(`Failed to fetch homepage: ${mainPageResponse.status}`);
          }

          const setCookieHeader = mainPageResponse.headers.get("set-cookie") || "";
          const cookies = setCookieHeader
              .split(",")
              .map(cookie => cookie.split(";")[0])
              .filter(cookie => cookie.trim().length > 0)
              .join("; ");
          
          console.log("Using cookies:", cookies ? "✓ Cookies obtained" : "⚠ No cookies found");

          // Add delay before API request to appear more human-like
          if (attempt > 1) {
              const delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000;
              console.log(`Waiting ${Math.round(delay)}ms before retry...`);
              await new Promise(resolve => setTimeout(resolve, delay));
          } else {
              // Small random delay even on first attempt
              await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
          }

          // Enhanced headers for API request
          const apiHeaders = {
              "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
              "Accept": "application/json, text/plain, */*",
              "Accept-Language": "en-US,en;q=0.9,de;q=0.8",
              "Accept-Encoding": "gzip, deflate, br",
              "Referer": "https://www.vinted.de/",
              "Origin": "https://www.vinted.de",
              "Cookie": cookies,
              "Sec-Fetch-Dest": "empty",
              "Sec-Fetch-Mode": "cors",
              "Sec-Fetch-Site": "same-origin",
              "Sec-Ch-Ua": '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
              "Sec-Ch-Ua-Mobile": "?0",
              "Sec-Ch-Ua-Platform": '"macOS"',
              "Cache-Control": "no-cache",
              "Pragma": "no-cache"
          };

          console.log("Making API request to Vinted...");
          const response = await fetch(url, {
              headers: apiHeaders,
              method: 'GET',
              redirect: 'follow'
          });

          console.log(`Vinted API response status for "${cleanedQuery}": ${response.status}`);

          if (response.status === 429) {
              // Rate limited - wait longer before retry
              console.warn(`Rate limited (429) on attempt ${attempt}. Will retry with longer delay.`);
              if (attempt < maxRetries) {
                  const rateLimitDelay = baseDelay * Math.pow(3, attempt) + Math.random() * 2000;
                  console.log(`Rate limit delay: ${Math.round(rateLimitDelay)}ms`);
                  await new Promise(resolve => setTimeout(resolve, rateLimitDelay));
                  continue;
              }
              throw new Error(`Rate limited after ${maxRetries} attempts`);
          }

          if (response.status === 403) {
              console.warn(`Access forbidden (403) on attempt ${attempt}`);
              if (attempt < maxRetries) {
                  // Try with slightly different approach on next attempt
                  continue;
              }
              throw new Error(`Access forbidden after ${maxRetries} attempts`);
          }

          if (!response.ok) {
              const errorText = await response.text();
              console.error(`Vinted API error for query "${cleanedQuery}": ${response.status} ${errorText}`);
              
              // Don't retry on client errors (4xx) except 403 and 429
              if (response.status >= 400 && response.status < 500 && response.status !== 403 && response.status !== 429) {
                  console.log(`Client error ${response.status}, not retrying`);
                  return [];
              }
              
              // Retry on server errors (5xx)
              if (attempt < maxRetries) {
                  console.log(`Server error ${response.status}, will retry`);
                  continue;
              }
              
              throw new Error(`HTTP ${response.status}: ${errorText}`);
          }

          const data = await response.json();
          console.log(`✓ Successfully fetched data for "${cleanedQuery}"`);

          if (!data.items) {
              console.log("No items found in Vinted response.");
              return [];
          }

          // Transform and return the data
          const items = data.items.map((item: any): ScrapedItem => ({
              id: `vinted_${item.id}`,
              photo: item.photo?.thumbnails?.[3]?.url || item.photo?.url || "https://placehold.co/250x250/4F46E5/FFFFFF?text=Vinted+Item",
              title: item.title || "Untitled",
              price: item.price?.amount ? `${item.price.amount} ${item.price.currency_code}` : "N/A",
              priceNumeric: item.price?.amount ? parseFloat(item.price.amount) : undefined,
              imageUrl: item.photo?.url || "https://placehold.co/250x250/4F46E5/FFFFFF?text=Vinted+Item",
              condition: item.status || "N/A",
              link: item.url || `https://www.vinted.de/items/${item.id}`,
              platform: "Vinted",
              brand: item.brand_title || "Unknown",
              size: item.size_title || "N/A",
          }));

          console.log(`Found ${items.length} items for query "${cleanedQuery}"`);
          return items;

      } catch (error: any) {
          console.error(`Error on attempt ${attempt} for query "${cleanedQuery}":`, error.message);
          
          // If this was the last attempt, return empty array
          if (attempt === maxRetries) {
              console.error(`All ${maxRetries} attempts failed for query "${cleanedQuery}"`);
              return [];
          }
          
          // Calculate delay for next attempt
          const retryDelay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
          console.log(`Retrying in ${Math.round(retryDelay)}ms...`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
  }

  // This should never be reached, but just in case
  console.error(`Unexpected end of retry loop for query "${cleanedQuery}"`);
  return [];
}


export async function POST(req: NextRequest) {
  try {
    const { queries, filters } = await req.json();
    if (!queries || !Array.isArray(queries) || queries.length === 0) {
      return NextResponse.json({ error: "Search queries are required." }, { status: 400 });
    }

    console.log("Fetching products sequentially for queries:", queries);
    console.log("With filters:", filters);

    // Transform filters to VintedFilters format
    const vintedFilters: VintedFilters = {
      priceRange: filters?.priceRange,
      sizes: filters?.sizes,
      brands: filters?.brands,
      categories: filters?.categories,
      materials: filters?.materials,
      colors: filters?.colors,
      conditions: filters?.conditions,
      order: filters?.order || 'newest_first' // Default to newest first for best items
    };

    let allProducts: ScrapedItem[] = [];

    // 1. Run all searches sequentially with Vinted API filters
    for (const query of queries) {
        const products = await searchVinted(query, vintedFilters);
        allProducts.push(...products);
        // Add a small delay between each query to be less aggressive
        await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
    }

    // 2. Deduplicate the results
    let uniqueProducts = Array.from(new Map(allProducts.map(item => [item.id, item])).values());

    console.log(`Found ${uniqueProducts.length} unique products before filtering`);

    // 3. Additional client-side filtering (if needed for compatibility with legacy filters)
    // Note: Most filtering is now done via Vinted API, but we keep this for backward compatibility
    if (filters?.sizes && filters.sizes.length > 0) {
      uniqueProducts = uniqueProducts.filter(product => {
        if (!product.size) return false;
        return filters.sizes.some((size: string) =>
          product.size.toLowerCase().includes(size.toLowerCase()) ||
          size.toLowerCase().includes(product.size.toLowerCase())
        );
      });
    }

    // 4. Limit total results to prevent performance issues
    const MAX_RESULTS = 200; // Maximum products to return (enough for infinite scroll)
    if (uniqueProducts.length > MAX_RESULTS) {
      console.log(`Limiting results from ${uniqueProducts.length} to ${MAX_RESULTS}`);
      uniqueProducts = uniqueProducts.slice(0, MAX_RESULTS);
    }

    // 5. Shuffle the filtered results (optional - can be disabled if order is important)
    const shouldShuffle = !vintedFilters.order || vintedFilters.order === 'relevance';
    const finalProducts = shouldShuffle
      ? uniqueProducts.sort(() => 0.5 - Math.random())
      : uniqueProducts;

    console.log(`Returning ${finalProducts.length} products after filtering and limiting`);

    return NextResponse.json({ products: finalProducts });

  } catch (error: any) {
    console.error("Error in external search API:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch products." }, { status: 500 });
  }
}