import { NextRequest, NextResponse } from "next/server";

// --- Helper functions (searchDepop, searchVinted) and interface (ScrapedItem) remain the same ---

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

// Helper function to simulate a call to a Vinted scraper
async function searchVinted(query: string): Promise<any[]> {
    console.log(`Simulating search on Vinted for: "${query}"`);
    // Returning mock data for demonstration
    return [
        {
            id: `vinted_${Math.random().toString(36).substr(2, 9)}`,
            title: `${query}`,
            price: "120.00",
            imageUrl: "https://placehold.co/250x250/4F46E5/FFFFFF?text=Vinted+Item",
            condition: "New with tags",
            link: `https://www.vinted.de/catalog?search_text=${encodeURIComponent(query)}`,
            platform: "Vinted",
            brand: `${query.split(' ')[0]}`,
            size: "UK 9",
        },
        {
            id: `vinted_${Math.random().toString(36).substr(2, 9)}`,
            title: `${query}`,
            price: "250.00",
            imageUrl: "https://placehold.co/250x250/4F46E5/FFFFFF?text=Vinted+Item+2",
            condition: "Used - very good",
            link: `https://www.vinted.de/catalog?search_text=${encodeURIComponent(query)}`,
            platform: "Vinted",
            brand: `${query.split(' ')[0]}`,
            size: "Medium",
        },
    ];
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