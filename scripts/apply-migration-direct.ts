import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

console.log('🔌 Connecting to Supabase...');
const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
  console.log('\n📦 Reading migration file...');

  const migrationPath = path.join(process.cwd(), 'supabase/migrations/20250111000000_vibe_entities.sql');
  const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

  console.log('✅ Migration loaded');
  console.log(`   Size: ${(migrationSQL.length / 1024).toFixed(1)}KB\n`);

  // Split into individual DDL statements
  // We need to execute them separately because Supabase client doesn't support multi-statement SQL
  const statements = migrationSQL
    .split(/;\s*$/m)
    .map(s => s.trim())
    .filter(s => s.length > 10 && !s.startsWith('--'));

  console.log(`📝 Found ${statements.length} SQL statements to execute\n`);

  // Execute each statement via raw SQL
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    const preview = stmt.substring(0, 80).replace(/\s+/g, ' ');

    console.log(`[${i + 1}/${statements.length}] ${preview}...`);

    try {
      // Use raw SQL execution
      const { data, error } = await supabase.rpc('exec_sql', { query: stmt + ';' });

      if (error) {
        // If exec_sql RPC doesn't exist, we need to execute via REST API directly
        console.log('   ⚠️  exec_sql RPC not available');
        console.log('   📋 You need to run this statement manually in Supabase SQL Editor');
        errorCount++;
      } else {
        console.log('   ✅ Executed successfully');
        successCount++;
      }
    } catch (err: any) {
      console.log(`   ❌ Error: ${err.message}`);
      errorCount++;
    }
  }

  console.log('\n' + '═'.repeat(60));
  console.log('📊 MIGRATION SUMMARY');
  console.log('═'.repeat(60));
  console.log(`✅ Succeeded: ${successCount}/${statements.length}`);
  console.log(`❌ Failed:    ${errorCount}/${statements.length}`);
  console.log('═'.repeat(60));

  if (errorCount > 0) {
    console.log('\n⚠️  MANUAL ACTION REQUIRED:');
    console.log('Some statements need to be executed manually in Supabase SQL Editor.');
    console.log('\n📋 STEPS:');
    console.log('1. Go to: https://supabase.com/dashboard/project/ymkigxqxwdwupcfcdfen/sql/new');
    console.log('2. Copy the entire file: supabase/migrations/20250111000000_vibe_entities.sql');
    console.log('3. Paste and click "Run"');
    console.log('4. Verify with: SELECT COUNT(*) FROM vibe_entities;\n');
  } else {
    console.log('\n✅ Migration applied successfully!');
    console.log('Verify with: SELECT COUNT(*) FROM vibe_entities;\n');
  }
}

applyMigration().catch(console.error);
