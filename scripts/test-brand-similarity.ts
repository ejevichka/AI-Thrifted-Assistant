import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testBrandSimilarity() {
  console.log('🧬 Testing brand similarity search for "Rick Owens"...\n');

  try {
    // Direct workaround: Get Rick Owens vector and find similar manually
    const { data: rickOwens, error: fetchError } = await supabase
      .from('vibe_entities')
      .select('entity_name, vibe_vector, metadata')
      .eq('entity_name', 'Rick Owens')
      .eq('entity_type', 'brand')
      .single();

    if (fetchError || !rickOwens) {
      console.error('❌ Rick Owens not found:', fetchError);
      return;
    }

    console.log('✅ Found Rick Owens');
    console.log('📊 Top styles:', rickOwens.metadata?.top_styles);
    console.log('\n🔍 Searching for similar brands...\n');

    // Manual vector search using cosine distance
    const { data: similar, error: searchError } = await supabase.rpc(
      'match_brands_by_vector',
      {
        query_vector: rickOwens.vibe_vector,
        match_threshold: 0.3,
        match_count: 10
      }
    );

    if (searchError) {
      console.log('⚠️  RPC function not available, trying alternative approach...\n');

      // Alternative: Use the fixed function directly
      const { data: alt, error: altError } = await supabase
        .rpc('find_similar_brands', {
          brand_name: 'Rick Owens',
          match_limit: 10,
          min_similarity: 0.3
        });

      if (altError) {
        console.error('❌ Error:', altError.message);
        console.log('\n📋 Please apply the hotfix migration first:');
        console.log('   File: supabase/migrations/20250112000000_fix_brand_similarity.sql');
        console.log('   URL: https://supabase.com/dashboard/project/ymkigxqxwdwupcfcdfen/sql/new\n');
        return;
      }

      console.log('✅ Similar brands to Rick Owens:\n');
      alt.forEach((brand: any, i: number) => {
        console.log(`${i + 1}. ${brand.entity_name}`);
        console.log(`   Similarity: ${(brand.similarity * 100).toFixed(1)}%`);
        console.log(`   Shared styles: ${brand.shared_styles?.join(', ') || 'N/A'}`);
        console.log('');
      });
      return;
    }

    console.log('✅ Similar brands:', similar);
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testBrandSimilarity();
