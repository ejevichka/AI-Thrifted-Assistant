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
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

async function applyMigration() {
  console.log('\n📦 Reading migration file...');
  const migrationSQL = fs.readFileSync(
    path.join(process.cwd(), 'supabase/migrations/20250111000000_vibe_entities.sql'),
    'utf-8'
  );

  console.log('📝 Migration file loaded');
  console.log(`   Size: ${migrationSQL.length} characters\n`);

  console.log('🚀 Applying migration via SQL Editor...');
  console.log('⚠️  Note: You need to run this SQL manually in Supabase SQL Editor');
  console.log('   Dashboard: https://supabase.com/dashboard/project/YOUR_PROJECT/sql/new\n');

  // Try to execute via REST API (this works for simple queries)
  console.log('Attempting automatic execution...\n');

  // Split into major statements
  const statements = migrationSQL
    .split(/;\s*(?=CREATE|DROP|COMMENT)/i)
    .map(s => s.trim())
    .filter(s => s.length > 10);

  console.log(`Found ${statements.length} major statements\n`);

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    const preview = stmt.substring(0, 80).replace(/\s+/g, ' ');

    console.log(`[${i + 1}/${statements.length}] ${preview}...`);

    try {
      // For CREATE TABLE, DROP, etc., we use raw SQL execution
      const { data, error } = await supabase.rpc('exec', { sql: stmt });

      if (error) {
        // If RPC doesn't exist, try alternative approach
        console.log('   ⚠️  RPC method not available, trying query method...');

        // This won't work for DDL, but let's log it
        console.log('   ⚠️  Manual execution required in SQL Editor');
        console.log('   Statement:', stmt.substring(0, 200));
      } else {
        console.log('   ✅ Executed successfully');
      }
    } catch (err: any) {
      console.log(`   ⚠️  ${err.message}`);
    }

    console.log('');
  }

  console.log('\n📋 MANUAL MIGRATION INSTRUCTIONS:');
  console.log('1. Go to: https://supabase.com/dashboard/project/ymkigxqxwdwupcfcdfen/sql/new');
  console.log('2. Copy the contents of: supabase/migrations/20250111000000_vibe_entities.sql');
  console.log('3. Paste into SQL Editor and click "Run"');
  console.log('4. Verify the table was created with: SELECT * FROM vibe_entities LIMIT 1;\n');
}

applyMigration().catch(console.error);
