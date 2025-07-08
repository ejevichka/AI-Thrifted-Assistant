import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseClient = createClient(supabaseUrl, supabaseKey);

export async function GET() {
  try {
    // First, let's see what data exists in the table
    const { data: allData, error: allError } = await supabaseClient
      .from('vinted_documents')
      .select('content, metadata')
      .limit(5);

    if (allError) {
      console.error('Error fetching all data:', allError);
      return NextResponse.json({ error: 'Failed to fetch data', details: allError }, { status: 500 });
    }

    console.log('Sample data from vinted_documents:', allData);

    // Check if we have any records at all
    if (!allData || allData.length === 0) {
      return NextResponse.json({ 
        error: 'No data found in vinted_documents table',
        brands: [],
        debug: { sampleData: allData }
      });
    }

    // Try to find brands using a simpler approach
    const brandsData = allData.filter(item => {
      try {
        // Check if metadata exists and has dataset property
        return item.metadata && 
               typeof item.metadata === 'object' && 
               item.metadata.dataset === 'brands';
      } catch (e) {
        console.error('Error checking metadata:', e, item);
        return false;
      }
    });

    const formattedBrands = brandsData.map(brand => ({
      name: brand.metadata?.brand || 'Unknown Brand',
      description: brand.content || 'No description available',
      ...brand.metadata
    }));

    return NextResponse.json({ 
      brands: formattedBrands,
      debug: {
        totalRecords: allData.length,
        brandsFound: formattedBrands.length,
        sampleMetadata: allData[0]?.metadata
      }
    });

  } catch (error) {
    console.error('Error in brands API:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}