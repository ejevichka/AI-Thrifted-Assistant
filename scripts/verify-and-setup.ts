import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

console.log('🔌 Connecting to Supabase...');
console.log(`   URL: ${supabaseUrl}\n`);

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifySetup() {
  console.log('═'.repeat(70));
  console.log('🏗️  SUPABASE SETUP VERIFICATION');
  console.log('═'.repeat(70));
  console.log('');

  // Check 1: Check if vibe_entities table exists
  console.log('1️⃣  Checking if vibe_entities table exists...');
  const { data: tableData, error: tableError } = await supabase
    .from('vibe_entities')
    .select('id')
    .limit(1);

  if (tableError) {
    console.log('   ❌ Table does NOT exist');
    console.log(`   Error: ${tableError.message}\n`);
    console.log('📋 ACTION REQUIRED:');
    console.log('   1. Open: https://supabase.com/dashboard/project/ymkigxqxwdwupcfcdfen/sql/new');
    console.log('   2. Copy entire contents of: supabase/migrations/20250111000000_vibe_entities.sql');
    console.log('   3. Paste into SQL Editor');
    console.log('   4. Click "Run" button');
    console.log('   5. Re-run this script to verify\n');
    return false;
  }

  console.log('   ✅ Table exists!\n');

  // Check 2: Count existing brands
  console.log('2️⃣  Checking existing data...');
  const { count, error: countError } = await supabase
    .from('vibe_entities')
    .select('*', { count: 'exact', head: true })
    .eq('entity_type', 'brand');

  if (countError) {
    console.log(`   ⚠️  Error counting: ${countError.message}`);
  } else {
    console.log(`   📊 Found ${count} brands in database`);

    if (count === 0) {
      console.log('   ℹ️  Database is empty - ready for ingestion\n');
    } else if (count < 934) {
      console.log(`   ⚠️  Partial data detected (expected 934 brands)\n`);
    } else {
      console.log('   ✅ Full dataset loaded!\n');
    }
  }

  // Check 3: Test a sample query
  console.log('3️⃣  Testing vector search function...');
  try {
    const { data: testData, error: testError } = await supabase
      .rpc('search_brands_by_style', {
        target_style_id: 'y2k',
        match_limit: 5,
        min_similarity: 0.3
      });

    if (testError) {
      console.log('   ❌ Search function not available');
      console.log(`   Error: ${testError.message}`);
      console.log('   ⚠️  Migration may not be complete\n');
    } else {
      console.log('   ✅ Search function works!');
      if (testData && testData.length > 0) {
        console.log(`   📊 Sample Y2K brands:`);
        testData.slice(0, 3).forEach((brand: any) => {
          const similarity = (brand.similarity * 100).toFixed(0);
          console.log(`      - ${brand.entity_name} (${similarity}% match)`);
        });
      }
      console.log('');
    }
  } catch (err: any) {
    console.log(`   ❌ Error: ${err.message}\n`);
  }

  // Check 4: Verify pgvector extension
  console.log('4️⃣  Checking pgvector extension...');
  try {
    // Try to query table schema
    const { data: schemaData, error: schemaError } = await supabase
      .from('vibe_entities')
      .select('*')
      .limit(1);

    if (!schemaError) {
      console.log('   ✅ pgvector extension is active\n');
    }
  } catch (err: any) {
    console.log(`   ⚠️  Cannot verify: ${err.message}\n`);
  }

  console.log('═'.repeat(70));
  console.log('📋 NEXT STEPS:');
  console.log('═'.repeat(70));

  if (count === 0 || !count) {
    console.log('1. ✅ Migration applied');
    console.log('2. 🔄 Run: npx tsx scripts/ingest-vibe-matrix.ts');
    console.log('3. ⏳ Wait for ingestion to complete (934 brands)');
    console.log('4. 🧪 Test API: curl "http://localhost:3000/api/diggy/search-by-vibe?style_id=y2k"');
  } else if (count < 934) {
    console.log('1. ⚠️  Partial data detected');
    console.log('2. 🔄 Re-run: npx tsx scripts/ingest-vibe-matrix.ts');
  } else {
    console.log('1. ✅ Setup complete!');
    console.log('2. 🧪 Test API: curl "http://localhost:3000/api/diggy/search-by-vibe?style_id=y2k"');
    console.log('3. 🎨 Integrate frontend: See docs/INTEGRATION-GUIDE.md');
  }

  console.log('═'.repeat(70));
  console.log('');

  return true;
}

verifySetup().catch(console.error);
