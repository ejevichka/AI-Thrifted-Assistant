-- Apply this SQL in Supabase SQL Editor
-- URL: https://supabase.com/dashboard/project/ymkigxqxwdwupcfcdfen/sql

-- Create GIN index on metadata JSONB column
CREATE INDEX IF NOT EXISTS vibe_entities_metadata_gin_idx
ON vibe_entities
USING GIN (metadata);

-- Create indexes on frequently queried metadata fields
CREATE INDEX IF NOT EXISTS vibe_entities_tier_idx
ON vibe_entities ((metadata->>'tier'));

CREATE INDEX IF NOT EXISTS vibe_entities_price_idx
ON vibe_entities ((metadata->>'avg_price'));

CREATE INDEX IF NOT EXISTS vibe_entities_category_idx
ON vibe_entities ((metadata->>'core_category'));

-- Verify indexes were created
SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'vibe_entities'
  AND indexname LIKE '%metadata%'
ORDER BY indexname;
