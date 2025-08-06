import { NextRequest, NextResponse } from "next/server";

interface ScrapedItem {
    id: string;
    title: string;
    price: string;
    imageUrl: string;
    condition: string;
    link: string;
    platform: "Vinted" | "Depop";
    brand: string;
    size: string;
}

// Helper function to simulate a call to a Depop scraper
async function searchDepop(query: string): Promise<any[]> {
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

async function searchVinted(query: string): Promise<ScrapedItem[]> {
    console.log(`Searching Vinted for: "${query}"`);
    try {
        const url = `https://www.vinted.de/api/v2/catalog/items?page=1&per_page=24&search_text=${encodeURIComponent(query)}&order=relevance`;
        
        // This is a simplified approach. For a real application,
        // we would need a more robust way to handle authentication and cookies.
        // For now, we'll try to get cookies from the main page on each request.
        const mainPageResponse = await fetch("https://www.vinted.de/");
        const cookie = mainPageResponse.headers.get("set-cookie");

        const response = await fetch(url, {
            headers: {
                "Cookie": cookie || "",
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Vinted API error for query "${query}": ${response.status} ${errorText}`);
            return [];
        }

        const data = await response.json();

        if (!data.items) {
            return [];
        }

        return data.items.map((item: any): ScrapedItem => ({
            id: `vinted_${item.id}`,
            title: item.title,
            price: item.price?.amount ? `${item.price.amount} ${item.price.currency_code}` : "N/A",
            imageUrl: item.photo?.url || "https://placehold.co/250x250/4F46E5/FFFFFF?text=Vinted+Item",
            condition: item.status || "N/A",
            link: item.url,
            platform: "Vinted",
            brand: item.brand_title || "Unknown",
            size: item.size_title || "N/A",
        }));
    } catch (error) {
        console.error(`Error in searchVinted for query "${query}":`, error);
        return [];
    }
}


export async function POST(req: NextRequest) {
  try {
    const { queries } = await req.json();
    if (!queries || !Array.isArray(queries) || queries.length === 0) {
      return NextResponse.json({ error: "Search queries are required." }, { status: 400 });
    }

    console.log("Fetching products for specific queries:", queries);

    // --- REFACTORED LOGIC ---

    // 1. Create an array of search promises for each query
    const searchPromises = queries.flatMap(query => [
        searchVinted(query),
        searchDepop(query)
    ]);

    // 2. Run all searches in parallel
    const resultsFromAllSearches = await Promise.all(searchPromises);

    // 3. Flatten the array of arrays into a single list of products
    const allProducts = resultsFromAllSearches.flat();

    // 4. (Crucial) Deduplicate the results to avoid showing the same item multiple times
    const uniqueProducts = Array.from(new Map(allProducts.map(item => [item.id, item])).values());
    
    // 5. Shuffle the unique results for a more dynamic and interesting feed
    const shuffledProducts = uniqueProducts.sort(() => 0.5 - Math.random());

    return NextResponse.json({ products: shuffledProducts });

  } catch (error: any) {
    console.error("Error in external search API:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch products." }, { status: 500 });
  }
}