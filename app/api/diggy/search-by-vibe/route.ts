import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

// Style dimension order (MUST match migration order)
const STYLE_IDS = [
  'casual', 'formal', 'sporty', 'vintage', 'bohemian', 'y2k',
  'grunge', 'goth', 'techwear', 'gorpcore', 'academia', 'avantgarde',
  'streetwear', 'cottagecore', 'clubkid', 'balletcore', 'kfashion',
  'harajuku', 'minimaljapan', 'deconstructed', 'eclecticgrandpa',
  'mobwife', 'blokecore', 'officesiren'
];

interface SearchRequest {
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

interface BrandResult {
  entity_name: string;
  similarity: number;
  shared_styles?: string[];
  metadata?: any;
}

export async function POST(req: NextRequest) {
  try {
    const body: SearchRequest = await req.json();

    // Validate request
    if (!body.style_id && !body.style_weights && !body.brand_name) {
      return NextResponse.json(
        { error: 'Must provide style_id, style_weights, or brand_name' },
        { status: 400 }
      );
    }

    // Connect to Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: 'Database configuration missing' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const limit = body.limit || 20;
    const minSimilarity = body.min_similarity || 0.3;

    let results: BrandResult[] = [];

    // Mode 1: Single style search
    if (body.style_id) {
      const { data, error } = await supabase.rpc('search_brands_by_style', {
        target_style_id: body.style_id,
        match_limit: limit,
        min_similarity: minSimilarity
      });

      if (error) {
        console.error('search_brands_by_style error:', error);
        return NextResponse.json(
          { error: `Search failed: ${error.message}` },
          { status: 500 }
        );
      }

      results = data || [];
    }
    // Mode 2: Multi-style weighted search
    else if (body.style_weights) {
      const { data, error } = await supabase.rpc('search_brands_by_styles', {
        style_weights: body.style_weights,
        match_limit: limit,
        min_similarity: minSimilarity
      });

      if (error) {
        console.error('search_brands_by_styles error:', error);
        return NextResponse.json(
          { error: `Search failed: ${error.message}` },
          { status: 500 }
        );
      }

      results = data || [];
    }
    // Mode 3: Brand similarity search
    else if (body.brand_name) {
      const { data, error } = await supabase.rpc('find_similar_brands', {
        brand_name: body.brand_name,
        match_limit: limit,
        min_similarity: minSimilarity
      });

      if (error) {
        console.error('find_similar_brands error:', error);
        return NextResponse.json(
          { error: `Search failed: ${error.message}` },
          { status: 500 }
        );
      }

      results = data || [];
    }

    // Return results
    return NextResponse.json({
      results,
      count: results.length,
      query: {
        style_id: body.style_id,
        style_weights: body.style_weights,
        brand_name: body.brand_name,
        limit,
        min_similarity: minSimilarity
      }
    });

  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint for simple queries
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const styleId = searchParams.get('style_id');
    const brandName = searchParams.get('brand_name');
    const limit = parseInt(searchParams.get('limit') || '20');
    const minSimilarity = parseFloat(searchParams.get('min_similarity') || '0.3');

    if (!styleId && !brandName) {
      return NextResponse.json(
        { error: 'Must provide style_id or brand_name query parameter' },
        { status: 400 }
      );
    }

    // Forward to POST handler
    const body: SearchRequest = {
      style_id: styleId || undefined,
      brand_name: brandName || undefined,
      limit,
      min_similarity: minSimilarity
    };

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    const supabase = createClient(supabaseUrl, supabaseKey);

    let results: BrandResult[] = [];

    if (styleId) {
      const { data, error } = await supabase.rpc('search_brands_by_style', {
        target_style_id: styleId,
        match_limit: limit,
        min_similarity: minSimilarity
      });

      if (error) {
        return NextResponse.json(
          { error: `Search failed: ${error.message}` },
          { status: 500 }
        );
      }

      results = data || [];
    } else if (brandName) {
      const { data, error } = await supabase.rpc('find_similar_brands', {
        brand_name: brandName,
        match_limit: limit,
        min_similarity: minSimilarity
      });

      if (error) {
        return NextResponse.json(
          { error: `Search failed: ${error.message}` },
          { status: 500 }
        );
      }

      results = data || [];
    }

    return NextResponse.json({
      results,
      count: results.length,
      query: { style_id: styleId, brand_name: brandName, limit, min_similarity: minSimilarity }
    });

  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
