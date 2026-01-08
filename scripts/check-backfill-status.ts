import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkBackfillStatus() {
  console.log('📊 Checking brand metadata backfill status...\n');

  // Get overall stats
  const { data: statsData, error: statsError } = await supabase
    .from('vibe_entities')
    .select('id, metadata')
    .eq('entity_type', 'brand');

  if (statsError) {
    console.error('❌ Error fetching stats:', statsError);
    return;
  }

  const total = statsData?.length || 0;
  const withMetadata = statsData?.filter(b => b.metadata && b.metadata.tier).length || 0;
  const withoutMetadata = total - withMetadata;
  const percentComplete = ((withMetadata / total) * 100).toFixed(1);

  console.log('📈 Overall Progress:');
  console.log(`   Total brands: ${total}`);
  console.log(`   ✅ With metadata: ${withMetadata} (${percentComplete}%)`);
  console.log(`   ⏳ Without metadata: ${withoutMetadata}`);
  console.log('');

  // Get tier distribution
  if (withMetadata > 0) {
    const { data: tierData } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT
          metadata->>'tier' as tier,
          COUNT(*) as count
        FROM vibe_entities
        WHERE entity_type = 'brand'
          AND metadata->>'tier' IS NOT NULL
        GROUP BY metadata->>'tier'
        ORDER BY count DESC
      `
    });

    console.log('🏆 Tier Distribution:');
    const tiers = statsData
      .filter(b => b.metadata?.tier)
      .reduce((acc: any, b: any) => {
        const tier = b.metadata.tier;
        acc[tier] = (acc[tier] || 0) + 1;
        return acc;
      }, {});

    Object.entries(tiers)
      .sort(([, a]: any, [, b]: any) => b - a)
      .forEach(([tier, count]) => {
        const percent = ((count as number / withMetadata) * 100).toFixed(1);
        console.log(`   ${tier}: ${count} (${percent}%)`);
      });
    console.log('');

    // Get price distribution
    console.log('💰 Price Distribution:');
    const prices = statsData
      .filter(b => b.metadata?.avg_price)
      .reduce((acc: any, b: any) => {
        const price = b.metadata.avg_price;
        acc[price] = (acc[price] || 0) + 1;
        return acc;
      }, {});

    Object.entries(prices)
      .sort(([, a]: any, [, b]: any) => b - a)
      .forEach(([price, count]) => {
        const percent = ((count as number / withMetadata) * 100).toFixed(1);
        console.log(`   ${price}: ${count} (${percent}%)`);
      });
    console.log('');

    // Get some example brands
    console.log('🔍 Sample Enriched Brands:');
    const samples = statsData
      .filter(b => b.metadata?.tier)
      .slice(0, 5);

    const { data: sampleBrands } = await supabase
      .from('vibe_entities')
      .select('entity_name, metadata')
      .eq('entity_type', 'brand')
      .not('metadata->>tier', 'is', null)
      .limit(5);

    sampleBrands?.forEach(brand => {
      console.log(`   ${brand.entity_name}:`);
      console.log(`     tier: ${brand.metadata.tier}`);
      console.log(`     price: ${brand.metadata.avg_price}`);
      console.log(`     tags: [${brand.metadata.context_tags?.join(', ')}]`);
      console.log(`     category: ${brand.metadata.core_category}`);
    });
  }

  console.log('\n💡 Next Steps:');
  if (withoutMetadata > 0) {
    console.log(`   ⏳ Backfill is ${withoutMetadata > 100 ? 'still running' : 'almost done'} (${withoutMetadata} brands remaining)`);
  } else {
    console.log('   ✅ Backfill complete! Apply GIN indexes (see APPLY-INDEXES.md)');
  }
}

checkBackfillStatus().catch(console.error);
