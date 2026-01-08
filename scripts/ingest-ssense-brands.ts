/**
 * Ingest SSENSE brands with VibeDNA vectors into Supabase
 *
 * Input files:
 * - data/ssense/ssense-brands.json (brand metadata)
 * - data/ssense/ssense-vibe-matrix.json (VibeDNA vectors)
 * - data/ssense/ssense-tier-suggestions.json (tier classifications)
 *
 * Target table: ssense_brands
 *
 * Usage: npx tsx scripts/ingest-ssense-brands.ts
 */

import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const BATCH_SIZE = 50;

// Load style definitions for vector order
const stylesEnhanced = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), 'data/vinted/styles-enhanced.json'), 'utf-8')
);
const STYLE_IDS = stylesEnhanced.styles.map((style: any) => style.id);

// Load data files
const dataDir = path.join(process.cwd(), 'data/ssense');

interface SSENSEBrand {
  brand_name: string;
  ssense_slug: string;
  available_women: boolean;
  available_men: boolean;
}

type VibeMatrix = Record<string, Record<string, number>>;
type TierMap = Record<string, string>;

console.log('📦 Loading data files...\n');

// Load brand metadata
const brandsFile = path.join(dataDir, 'ssense-brands.json');
if (!fs.existsSync(brandsFile)) {
  console.error(`❌ Brands file not found: ${brandsFile}`);
  console.error('   Run first: npx tsx scripts/parse-ssense-brands.ts');
  process.exit(1);
}
const brands: SSENSEBrand[] = JSON.parse(fs.readFileSync(brandsFile, 'utf-8'));
console.log(`✅ Loaded ${brands.length} brands`);

// Load VibeDNA matrix
const matrixFile = path.join(dataDir, 'ssense-vibe-matrix.json');
if (!fs.existsSync(matrixFile)) {
  console.error(`❌ Vibe matrix file not found: ${matrixFile}`);
  console.error('   Run first: npx tsx scripts/generate-ssense-vibe-matrix.ts');
  process.exit(1);
}
const vibeMatrix: VibeMatrix = JSON.parse(fs.readFileSync(matrixFile, 'utf-8'));
console.log(`✅ Loaded ${Object.keys(vibeMatrix).length} VibeDNA vectors`);

// Load tier suggestions
const tierFile = path.join(dataDir, 'ssense-tier-suggestions.json');
let tierMap: TierMap = {};
if (fs.existsSync(tierFile)) {
  tierMap = JSON.parse(fs.readFileSync(tierFile, 'utf-8'));
  console.log(`✅ Loaded ${Object.keys(tierMap).length} tier suggestions`);
} else {
  console.log(`⚠️  No tier file found, using default tier 'affordable'`);
}

console.log(`✅ Style dimensions: ${STYLE_IDS.length}`);
console.log(`   Order: ${STYLE_IDS.slice(0, 6).join(', ')}...\n`);

// Connect to Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('   Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

console.log('🔌 Connected to Supabase\n');

// Convert VibeDNA object to ordered vector array
function vibeDNAToVector(vibeDNA: Record<string, number>): number[] {
  return STYLE_IDS.map((styleId: string) => vibeDNA[styleId] || 0.0);
}

// Prepare entity for insertion
interface SSENSEBrandEntity {
  brand_name: string;
  ssense_slug: string;
  available_women: boolean;
  available_men: boolean;
  vibe_vector: number[] | null;
  tier: string;
  metadata: {
    top_styles: Array<{ style: string; score: number }>;
    average_score: number;
    vectorized: boolean;
  };
}

function prepareEntity(brand: SSENSEBrand): SSENSEBrandEntity {
  const vibeDNA = vibeMatrix[brand.brand_name];
  const hasVector = !!vibeDNA;

  let vector: number[] | null = null;
  let topStyles: Array<{ style: string; score: number }> = [];
  let avgScore = 0;

  if (hasVector) {
    vector = vibeDNAToVector(vibeDNA);

    topStyles = STYLE_IDS
      .map((style: string, idx: number) => ({ style, score: vector![idx] }))
      .filter(s => s.score > 0.3)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    avgScore = vector.reduce((sum, val) => sum + val, 0) / vector.length;
  }

  const tier = tierMap[brand.brand_name] || 'affordable';

  return {
    brand_name: brand.brand_name,
    ssense_slug: brand.ssense_slug,
    available_women: brand.available_women,
    available_men: brand.available_men,
    vibe_vector: vector,
    tier,
    metadata: {
      top_styles: topStyles,
      average_score: parseFloat(avgScore.toFixed(3)),
      vectorized: hasVector,
    },
  };
}

// Main ingestion function
async function ingestSSENSEBrands() {
  console.log('🚀 Starting SSENSE brands ingestion...\n');

  // Check if table exists
  console.log('🔍 Checking if ssense_brands table exists...');
  const { error: tableError } = await supabase
    .from('ssense_brands')
    .select('id')
    .limit(1);

  if (tableError) {
    console.error('❌ Table does not exist or is not accessible!');
    console.error('   Error:', tableError.message);
    console.error('\n📋 Please run the migration first:');
    console.error('   1. Go to Supabase SQL Editor');
    console.error('   2. Run: supabase/migrations/20250108000000_ssense_brands.sql\n');
    process.exit(1);
  }

  console.log('✅ Table exists and is accessible\n');

  // Prepare all entities
  console.log('📊 Preparing entities...');
  const entities = brands.map(brand => prepareEntity(brand));

  const withVectors = entities.filter(e => e.vibe_vector !== null);
  const withoutVectors = entities.filter(e => e.vibe_vector === null);

  console.log(`✅ Prepared ${entities.length} entities`);
  console.log(`   └── With vectors: ${withVectors.length}`);
  console.log(`   └── Without vectors: ${withoutVectors.length}\n`);

  // Clear existing data
  console.log('🗑️  Clearing existing SSENSE brands...');
  const { error: deleteError } = await supabase
    .from('ssense_brands')
    .delete()
    .neq('id', 0); // Delete all

  if (deleteError) {
    console.warn('⚠️  Could not clear existing data:', deleteError.message);
  } else {
    console.log('✅ Existing data cleared\n');
  }

  // Insert in batches
  console.log(`📤 Inserting ${entities.length} brands in batches of ${BATCH_SIZE}...\n`);

  let successCount = 0;
  let failureCount = 0;

  for (let i = 0; i < entities.length; i += BATCH_SIZE) {
    const batch = entities.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(entities.length / BATCH_SIZE);

    console.log(`[Batch ${batchNum}/${totalBatches}] Inserting ${batch.length} brands...`);

    const { data, error } = await supabase
      .from('ssense_brands')
      .insert(batch)
      .select('brand_name');

    if (error) {
      console.error(`   ❌ Batch error: ${error.message}`);

      // Try individual inserts
      console.log('   🔄 Retrying individual inserts...');
      for (const entity of batch) {
        const { error: singleError } = await supabase
          .from('ssense_brands')
          .insert(entity);

        if (singleError) {
          console.error(`      ❌ Failed: ${entity.brand_name} - ${singleError.message}`);
          failureCount++;
        } else {
          successCount++;
        }
      }
    } else {
      console.log(`   ✅ Inserted successfully`);
      successCount += batch.length;

      // Show examples
      if (data && data.length > 0) {
        const examples = data.slice(0, 3).map(d => d.brand_name).join(', ');
        console.log(`   Examples: ${examples}`);
      }
    }

    console.log('');
  }

  // Summary
  console.log('═'.repeat(60));
  console.log('📊 INGESTION SUMMARY');
  console.log('═'.repeat(60));
  console.log(`✅ Success: ${successCount}/${entities.length} brands`);
  console.log(`❌ Failed:  ${failureCount}/${entities.length} brands`);
  console.log(`📁 Source:  data/ssense/`);
  console.log(`🗄️  Table:   ssense_brands`);
  console.log('═'.repeat(60));

  // Tier distribution
  console.log('\n📈 Tier distribution:');
  const tierCounts: Record<string, number> = {};
  for (const entity of entities) {
    tierCounts[entity.tier] = (tierCounts[entity.tier] || 0) + 1;
  }
  Object.entries(tierCounts)
    .sort(([_, a], [__, b]) => b - a)
    .forEach(([tier, count]) => {
      const emoji = { icon: '👑', luxury: '💎', gem: '💍', affordable: '💰', mainstream: '🏪' }[tier] || '📦';
      console.log(`   ${emoji} ${tier}: ${count}`);
    });

  // Gender distribution
  console.log('\n📈 Gender distribution:');
  const womenOnly = entities.filter(e => e.available_women && !e.available_men).length;
  const menOnly = entities.filter(e => !e.available_women && e.available_men).length;
  const both = entities.filter(e => e.available_women && e.available_men).length;
  console.log(`   👩 Women only: ${womenOnly}`);
  console.log(`   👨 Men only: ${menOnly}`);
  console.log(`   👥 Both: ${both}`);

  // Verify insertion
  console.log('\n🔍 Verifying insertion...');
  const { count, error: countError } = await supabase
    .from('ssense_brands')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    console.error('❌ Could not verify:', countError.message);
  } else {
    console.log(`✅ Total brands in database: ${count}`);
  }

  // Show example queries
  console.log('\n📋 Example queries to test:');
  console.log('   1. Find Y2K SSENSE brands (women):');
  console.log("      SELECT * FROM search_ssense_brands_by_style('y2k', 'women', 10);");
  console.log('   2. Find avant-garde brands (all):');
  console.log("      SELECT * FROM search_ssense_brands_by_style('avantgarde', 'all', 10);");
  console.log('   3. Find SSENSE alternatives to a brand:');
  console.log("      SELECT * FROM find_ssense_alternatives('Rick Owens', 'all', 5);\n");
}

// Run ingestion
ingestSSENSEBrands()
  .then(() => {
    console.log('✅ SSENSE brands ingestion completed!\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Ingestion failed:', error);
    process.exit(1);
  });
