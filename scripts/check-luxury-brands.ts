import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkLuxuryBrands() {
  console.log('🔍 Checking which 3 brands are classified as "luxury" tier...\n');

  const { data, error } = await supabase
    .from('vibe_entities')
    .select('entity_name, metadata')
    .eq('entity_type', 'brand')
    .eq('metadata->>tier', 'luxury')
    .order('entity_name');

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  if (!data || data.length === 0) {
    console.log('⚠️  No brands found with tier="luxury"');
    console.log('   This might be a data issue or AI classified differently');
    return;
  }

  console.log(`Found ${data.length} brand(s) with tier="luxury":\n`);

  data.forEach((brand, idx) => {
    console.log(`${idx + 1}. ${brand.entity_name}`);
    console.log(`   tier: ${brand.metadata.tier}`);
    console.log(`   avg_price: ${brand.metadata.avg_price}`);
    console.log(`   context_tags: [${brand.metadata.context_tags?.join(', ')}]`);
    console.log(`   core_category: ${brand.metadata.core_category}`);
    console.log('');
  });

  console.log('💡 Analysis:');
  console.log('   These brands were classified as separate "luxury" tier instead of "icon".');
  console.log('   This might be correct if they are:');
  console.log('   - Ultra-high-end but not "iconic" in aesthetic sense');
  console.log('   - Very expensive but niche/less known');
  console.log('   - OR it could be an AI classification quirk\n');

  console.log('🔧 Recommendation:');
  console.log('   In your ranking logic, treat "luxury" similar to "icon" (high boost)');
  console.log('   Or manually reclassify these brands if needed.');
}

checkLuxuryBrands().catch(console.error);
