import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function applyIndexMigration() {
  console.log('🚀 Applying GIN index migration...\n');

  // Read migration file
  const migrationPath = path.join(
    process.cwd(),
    'supabase/migrations/20250116000000_add_metadata_gin_index.sql'
  );
  const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

  // Split by semicolons and filter out empty statements
  const statements = migrationSQL
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  console.log(`Found ${statements.length} SQL statements to execute\n`);

  let successCount = 0;
  let failureCount = 0;

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    console.log(`[${i + 1}/${statements.length}] Executing statement...`);

    // Show first 100 chars of statement
    const preview = statement.substring(0, 100).replace(/\n/g, ' ');
    console.log(`   ${preview}${statement.length > 100 ? '...' : ''}`);

    try {
      const { error } = await supabase.rpc('exec_sql', { sql: statement });

      if (error) {
        console.error(`   ❌ Error:`, error.message);
        failureCount++;

        // Try direct execution as fallback
        console.log(`   🔄 Trying direct execution...`);
        const { error: directError } = await supabase.from('_migrations').select('*').limit(1);

        if (!directError) {
          console.log(`   ⚠️  Cannot execute DDL directly, will need manual application`);
        }
      } else {
        console.log(`   ✅ Success`);
        successCount++;
      }
    } catch (err: any) {
      console.error(`   ❌ Exception:`, err.message);
      failureCount++;
    }

    console.log('');
  }

  console.log(`\n📊 Migration Summary:`);
  console.log(`   ✅ Successful: ${successCount}`);
  console.log(`   ❌ Failed: ${failureCount}`);

  if (failureCount > 0) {
    console.log(`\n⚠️  Some statements failed. You may need to apply them manually via Supabase SQL Editor:`);
    console.log(`   1. Go to: ${supabaseUrl.replace('https://', 'https://supabase.com/dashboard/project/')}/sql`);
    console.log(`   2. Copy the migration file contents`);
    console.log(`   3. Execute the SQL directly`);
  } else {
    console.log(`\n✅ All indexes created successfully!`);
  }
}

applyIndexMigration().catch(console.error);
