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
async function searchVinted(query: string): Promise<ScrapedItem[]> {
  const cleanedQuery = query.replace(/\n/g, " ").replace(/, let me find some great options for you!/g, "").trim();
  console.log(`Searching Vinted for: "${cleanedQuery}"`);

  const maxRetries = 3;
  const baseDelay = 5000; // 2 seconds base delay
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
          console.log(`Attempt ${attempt}/${maxRetries} for query: "${cleanedQuery}"`);
          
          const url = `https://www.vinted.de/api/v2/catalog/items?page=1&per_page=24&search_text=${encodeURIComponent(cleanedQuery)}&order=relevance`;
          
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

    // --- REFACTORED LOGIC ---
    
    let allProducts: ScrapedItem[] = [];
    
    // 1. Run all searches sequentially
    for (const query of queries) {
        const products = await searchVinted(query);
        allProducts.push(...products);
        // Add a small delay between each query to be less aggressive
        await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
    }

    // 2. (Crucial) Deduplicate the results
    let uniqueProducts = Array.from(new Map(allProducts.map(item => [item.id, item])).values());
    
    // 3. Apply filters if provided
    if (filters) {
      // Filter by price range
      if (filters.priceRange) {
        const { min, max } = filters.priceRange;
        uniqueProducts = uniqueProducts.filter(product => {
          if (!product.priceNumeric) return true; // Include items without numeric price
          if (min !== null && min !== undefined && product.priceNumeric < min) return false;
          if (max !== null && max !== undefined && product.priceNumeric > max) return false;
          return true;
        });
      }

      // Filter by sizes
      if (filters.sizes && filters.sizes.length > 0) {
        uniqueProducts = uniqueProducts.filter(product => {
          if (!product.size) return false;
          // Check if product size matches any of the selected sizes
          return filters.sizes.some((size: string) => 
            product.size.toLowerCase().includes(size.toLowerCase()) ||
            size.toLowerCase().includes(product.size.toLowerCase())
          );
        });
      }
    }
    
    // 4. Shuffle the filtered results
    const shuffledProducts = uniqueProducts.sort(() => 0.5 - Math.random());

    return NextResponse.json({ products: shuffledProducts });

  } catch (error: any) {
    console.error("Error in external search API:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch products." }, { status: 500 });
  }
}