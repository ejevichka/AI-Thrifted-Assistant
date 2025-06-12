import { NextRequest, NextResponse } from "next/server";

// --- IMPORTANT ---
// This is a MOCK API. You need to replace the logic inside this function
// with actual calls to a Vinted/Depop scraping service like Apify, BrightData,
// or a custom scraper you've built.

// Example interface for a scraper's output
interface ScrapedItem {
  id: string;
  title: string;
  price: number;
  currency: string;
  url: string;
  image: { url: string };
  brand_title: string;
  size_title: string;
  status: string;
}

// Helper function to simulate a call to a Depop scraper
async function searchDepop(query: string): Promise<any[]> {
  console.log(`Simulating search on Depop for: "${query}"`);
  // In a real implementation, you would use 'node-fetch' or 'axios'
  // to call the Apify API endpoint for your Depop scraper actor.
  // const response = await fetch(`https://api.apify.com/v2/acts/your_depop_actor/run-sync-get-dataset-items?token=${process.env.APIFY_TOKEN}`, {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ searchQuery: query, limit: 10 }),
  // });
  // const data = await response.json();
  // return data;

  // Returning mock data for demonstration
  return [
    {
      id: `depop_${Math.random().toString(36).substr(2, 9)}`,
      title: `Vintage Y2K Graphic Tee - ${query}`,
      price: "25.00",
      imageUrl: "https://placehold.co/250x250/7C3AED/FFFFFF?text=Depop+Item",
      condition: "Used - good",
      link: "#",
      platform: "Depop",
      brand: "Vintage",
      size: "Large",
    },
  ];
}

// Helper function to simulate a call to a Vinted scraper
async function searchVinted(query: string): Promise<any[]> {
    console.log(`Simulating search on Vinted for: "${query}"`);
    // Similar to Depop, you would call your Vinted scraper API here.
    // Returning mock data for demonstration
    return [
        {
            id: `vinted_${Math.random().toString(36).substr(2, 9)}`,
            title: `Authentic Gorpcore Salomon XT-6 - ${query}`,
            price: "120.00",
            imageUrl: "https://placehold.co/250x250/4F46E5/FFFFFF?text=Vinted+Item",
            condition: "New with tags",
            link: "#",
            platform: "Vinted",
            brand: "Salomon",
            size: "UK 9",
        },
        {
            id: `vinted_${Math.random().toString(36).substr(2, 9)}`,
            title: `Rare Comme des Garçons Shirt - ${query}`,
            price: "250.00",
            imageUrl: "https://placehold.co/250x250/4F46E5/FFFFFF?text=Vinted+Item+2",
            condition: "Used - very good",
            link: "#",
            platform: "Vinted",
            brand: "Comme des Garçons",
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

    console.log("Fetching products for queries:", queries);

    // Run searches on both platforms in parallel for efficiency
    const [vintedResults, depopResults] = await Promise.all([
      searchVinted(queries.join(" ")), // Join queries for a broader search
      searchDepop(queries.join(" ")),
    ]);
    
    // Combine and format the results
    const allProducts = [...vintedResults, ...depopResults];

    // Shuffle results for a more dynamic feed
    const shuffledProducts = allProducts.sort(() => 0.5 - Math.random());

    return NextResponse.json({ products: shuffledProducts });

  } catch (error: any) {
    console.error("Error in external search API:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch products." }, { status: 500 });
  }
}