import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Configuration
const USE_SAMPLE = process.argv.includes('--sample');
const MATRIX_FILE = USE_SAMPLE
  ? 'data/vinted/brand-vibe-matrix-sample.json'
  : 'data/vinted/brand-vibe-matrix.json';

const BATCH_SIZE = 50; // Insert in batches for better performance

// Load data
console.log('📦 Loading data...\n');

const stylesEnhanced = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), 'data/vinted/styles-enhanced.json'), 'utf-8')
);

const brandVibeMatrix = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), MATRIX_FILE), 'utf-8')
);

// Get ordered list of style IDs (this is CRITICAL - order must match migration!)
const STYLE_IDS = stylesEnhanced.styles.map((style: any) => style.id);

console.log(`✅ Loaded ${Object.keys(brandVibeMatrix).length} brands`);
console.log(`✅ Style dimensions: ${STYLE_IDS.length}`);
console.log(`   Order: ${STYLE_IDS.join(', ')}\n`);

// Connect to Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

console.log('🔌 Connected to Supabase\n');

// Convert brand VibeDNA object to ordered vector array
function vibeDNAToVector(vibeDNA: Record<string, number>): number[] {
  return STYLE_IDS.map(styleId => vibeDNA[styleId] || 0.0);
}

// Prepare entities for insertion
interface VibeEntity {
  entity_name: string;
  entity_type: string;
  vibe_vector: number[];
  metadata: {
    top_styles: Array<{ style: string; score: number }>;
    average_score: number;
  };
}

function prepareEntity(brandName: string, vibeDNA: Record<string, number>): VibeEntity {
  const vector = vibeDNAToVector(vibeDNA);

  // Calculate metadata
  const topStyles = STYLE_IDS
    .map((style, idx) => ({ style, score: vector[idx] }))
    .filter(s => s.score > 0.3)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  const avgScore = vector.reduce((sum, val) => sum + val, 0) / vector.length;

  return {
    entity_name: brandName,
    entity_type: 'brand',
    vibe_vector: vector,
    metadata: {
      top_styles: topStyles,
      average_score: parseFloat(avgScore.toFixed(3))
    }
  };
}

// Main ingestion function
async function ingestVibeMatrix() {
  console.log('🚀 Starting ingestion...\n');

  const brands = Object.keys(brandVibeMatrix);
  const totalBrands = brands.length;

  // Prepare all entities
  console.log('📊 Preparing entities...');
  const entities = brands.map(brandName =>
    prepareEntity(brandName, brandVibeMatrix[brandName])
  );

  console.log(`✅ Prepared ${entities.length} entities\n`);

  // Check if table exists
  console.log('🔍 Checking if vibe_entities table exists...');
  const { data: tableCheck, error: tableError } = await supabase
    .from('vibe_entities')
    .select('id')
    .limit(1);

  if (tableError) {
    console.error('❌ Table does not exist or is not accessible!');
    console.error('   Error:', tableError.message);
    console.error('\n📋 Please run the migration first:');
    console.error('   1. Go to Supabase SQL Editor');
    console.error('   2. Run: supabase/migrations/20250111000000_vibe_entities.sql\n');
    process.exit(1);
  }

  console.log('✅ Table exists and is accessible\n');

  // Clear existing data
  console.log('🗑️  Clearing existing brand data...');
  const { error: deleteError } = await supabase
    .from('vibe_entities')
    .delete()
    .eq('entity_type', 'brand');

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
      .from('vibe_entities')
      .insert(batch)
      .select('entity_name');

    if (error) {
      console.error(`   ❌ Error: ${error.message}`);
      failureCount += batch.length;

      // Try individual inserts for this batch
      console.log('   🔄 Retrying individual inserts...');
      for (const entity of batch) {
        const { error: singleError } = await supabase
          .from('vibe_entities')
          .insert(entity);

        if (singleError) {
          console.error(`      ❌ Failed: ${entity.entity_name}`);
          failureCount++;
        } else {
          console.log(`      ✅ ${entity.entity_name}`);
          successCount++;
        }
      }
    } else {
      console.log(`   ✅ Inserted successfully`);
      successCount += batch.length;
    }

    // Show some examples
    if (data && data.length > 0) {
      const examples = data.slice(0, 3).map(d => d.entity_name).join(', ');
      console.log(`   Examples: ${examples}`);
    }

    console.log('');
  }

  // Summary
  console.log('═'.repeat(60));
  console.log('📊 INGESTION SUMMARY');
  console.log('═'.repeat(60));
  console.log(`✅ Success: ${successCount}/${totalBrands} brands`);
  console.log(`❌ Failed:  ${failureCount}/${totalBrands} brands`);
  console.log(`📁 Source:  ${MATRIX_FILE}`);
  console.log(`🗄️  Table:   vibe_entities`);
  console.log('═'.repeat(60));

  // Verify insertion
  console.log('\n🔍 Verifying insertion...');
  const { count, error: countError } = await supabase
    .from('vibe_entities')
    .select('*', { count: 'exact', head: true })
    .eq('entity_type', 'brand');

  if (countError) {
    console.error('❌ Could not verify:', countError.message);
  } else {
    console.log(`✅ Total brands in database: ${count}`);
  }

  // Show sample queries
  console.log('\n📋 Example queries to test:');
  console.log('   1. Find Y2K brands:');
  console.log("      SELECT * FROM search_brands_by_style('y2k', 10);");
  console.log('   2. Find brands similar to Cop Copine:');
  console.log("      SELECT * FROM find_similar_brands('Cop Copine', 10);");
  console.log('   3. Multi-style search:');
  console.log('      SELECT * FROM search_brands_by_styles(\'{"y2k": 0.8, "grunge": 0.5}\', 10);\n');
}

// Run ingestion
ingestVibeMatrix()
  .then(() => {
    console.log('✅ Ingestion completed successfully!\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Ingestion failed:', error);
    process.exit(1);
  });
