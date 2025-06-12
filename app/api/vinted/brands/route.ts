import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseClient = createClient(supabaseUrl, supabaseKey);

export async function GET() {
  try {
    const { data: brands, error } = await supabaseClient
      .from('vinted_documents')
      .select('content, metadata')
      .eq('metadata->dataset', 'brands');

    if (error) {
      console.error('Error fetching brands:', error);
      return NextResponse.json({ error: 'Failed to fetch brands' }, { status: 500 });
    }

    // Parse the content and metadata for each brand
    const formattedBrands = brands.map(brand => ({
      name: brand.metadata.brand,
      description: brand.content,
      ...brand.metadata
    }));

    return NextResponse.json({ brands: formattedBrands });
  } catch (error) {
    console.error('Error in brands API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 