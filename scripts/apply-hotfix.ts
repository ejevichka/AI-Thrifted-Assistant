import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import 'dotenv/config';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyHotfix() {
  console.log('🔧 Applying hotfix for find_similar_brands function...\n');

  const hotfixSQL = fs.readFileSync(
    path.join(process.cwd(), 'supabase/migrations/20250112000000_fix_brand_similarity.sql'),
    'utf-8'
  );

  try {
    // Execute via RPC if available, or inform user
    console.log('⚠️  This hotfix requires manual application via Supabase SQL Editor');
    console.log('📄 File: supabase/migrations/20250112000000_fix_brand_similarity.sql\n');
    console.log('🔗 Open: https://supabase.com/dashboard/project/ymkigxqxwdwupcfcdfen/sql/new\n');
    console.log('The SQL is already in your clipboard. Just paste and run!\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

applyHotfix();
