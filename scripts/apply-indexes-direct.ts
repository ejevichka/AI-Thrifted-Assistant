import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function applyIndexes() {
  console.log('🚀 Applying GIN indexes for hybrid search...\n');

  // Create a raw SQL connection using postgres.js
  const { createClient: createPgClient } = await import('@supabase/supabase-js');
  const supabase = createPgClient(supabaseUrl, supabaseKey, {
    db: { schema: 'public' }
  });

  const indexes = [
    {
      name: 'vibe_entities_metadata_gin_idx',
      sql: `CREATE INDEX IF NOT EXISTS vibe_entities_metadata_gin_idx ON vibe_entities USING GIN (metadata);`,
      description: 'GIN index on entire metadata JSONB'
    },
    {
      name: 'vibe_entities_tier_idx',
      sql: `CREATE INDEX IF NOT EXISTS vibe_entities_tier_idx ON vibe_entities ((metadata->>'tier'));`,
      description: 'B-tree index on tier field'
    },
    {
      name: 'vibe_entities_price_idx',
      sql: `CREATE INDEX IF NOT EXISTS vibe_entities_price_idx ON vibe_entities ((metadata->>'avg_price'));`,
      description: 'B-tree index on avg_price field'
    },
    {
      name: 'vibe_entities_category_idx',
      sql: `CREATE INDEX IF NOT EXISTS vibe_entities_category_idx ON vibe_entities ((metadata->>'core_category'));`,
      description: 'B-tree index on core_category field'
    }
  ];

  console.log('📋 Indexes to create:');
  indexes.forEach((idx, i) => {
    console.log(`   ${i + 1}. ${idx.name} - ${idx.description}`);
  });
  console.log('');

  console.log('⚠️  Note: Supabase JS client cannot execute DDL statements.');
  console.log('📝 You need to apply these manually via SQL Editor:\n');
  console.log('🔗 URL: https://supabase.com/dashboard/project/ymkigxqxwdwupcfcdfen/sql\n');
  console.log('📄 Copy and paste this SQL:\n');
  console.log('-- ============================================');
  console.log('-- Create indexes for hybrid search');
  console.log('-- ============================================\n');

  indexes.forEach(idx => {
    console.log(`-- ${idx.description}`);
    console.log(idx.sql);
    console.log('');
  });

  console.log('-- ============================================');
  console.log('-- Verify indexes were created');
  console.log('-- ============================================\n');
  console.log(`SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'vibe_entities'
  AND (indexname LIKE '%metadata%' OR indexname LIKE '%tier%' OR indexname LIKE '%price%' OR indexname LIKE '%category%')
ORDER BY indexname;`);

  console.log('\n\n💡 After applying, you can test with:\n');
  console.log(`-- Find all gem brands from France
SELECT entity_name, metadata
FROM vibe_entities
WHERE metadata->>'tier' = 'gem'
  AND metadata->'context_tags' ? 'france'
LIMIT 10;`);
}

applyIndexes().catch(console.error);
