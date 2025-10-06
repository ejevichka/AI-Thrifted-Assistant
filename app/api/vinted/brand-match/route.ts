import { NextRequest, NextResponse } from "next/server";
import { brandMatcher } from "../chat/brand-matcher";

/**
 * Brand Matching API Endpoint
 *
 * GET /api/vinted/brand-match?brand=KNWLS
 * Returns vibe-alike brands for the specified brand
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const brandName = searchParams.get('brand');

    if (!brandName) {
      return NextResponse.json(
        { error: 'Brand name is required. Use ?brand=BrandName' },
        { status: 400 }
      );
    }

    // Find the brand
    const brand = brandMatcher.findBrand(brandName);

    if (!brand) {
      return NextResponse.json(
        { error: `Brand "${brandName}" not found in database` },
        { status: 404 }
      );
    }

    // Find vibe-alike brands
    const vibeAlikes = brandMatcher.findVibeAlikeBrands(brandName, {
      limit: 5,
      minScore: 0.2
    });

    // Generate augmented search queries
    const searchQueries = brandMatcher.generateAugmentedSearchQueries(
      brandName,
      'jacket', // example item type
      3
    );

    return NextResponse.json({
      brand: {
        name: brand.brand,
        category: brand.category,
        vibeTags: brand.vibeTags,
        priceRange: brand.priceRange
      },
      vibeAlikeBrands: vibeAlikes,
      suggestedSearchQueries: searchQueries,
      explanation: `When searching for ${brandName}, we recommend also searching these affordable alternatives that share the same vibe: ${vibeAlikes.map(v => v.brand).join(', ')}`
    });

  } catch (error: any) {
    console.error('Error in brand-match API:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/vinted/brand-match
 * Find brands by vibe tags
 *
 * Body: { "vibeTags": ["y2k", "moto_glam"], "category": "Vintage/Affordable" }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { vibeTags, category = 'all', limit = 10 } = body;

    if (!vibeTags || !Array.isArray(vibeTags) || vibeTags.length === 0) {
      return NextResponse.json(
        { error: 'vibeTags array is required' },
        { status: 400 }
      );
    }

    // Find brands by vibe tags
    const matches = brandMatcher.findBrandsByVibeTags(vibeTags, {
      limit,
      minTagMatch: 1,
      category: category === 'all' ? 'all' : category
    });

    return NextResponse.json({
      searchedTags: vibeTags,
      category,
      matches,
      totalFound: matches.length
    });

  } catch (error: any) {
    console.error('Error in brand-match POST API:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
