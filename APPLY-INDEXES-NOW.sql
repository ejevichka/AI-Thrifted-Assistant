-- ============================================
-- Apply GIN Indexes for Hybrid Search
-- ============================================
-- Execute this SQL in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/ymkigxqxwdwupcfcdfen/sql
-- ============================================

-- 1. GIN index on entire metadata JSONB (for complex queries)
CREATE INDEX IF NOT EXISTS vibe_entities_metadata_gin_idx
ON vibe_entities
USING GIN (metadata);

-- 2. B-tree index on tier field (icon/gem/affordable/mainstream)
CREATE INDEX IF NOT EXISTS vibe_entities_tier_idx
ON vibe_entities ((metadata->>'tier'));

-- 3. B-tree index on avg_price field (low/mid/high/luxury)
CREATE INDEX IF NOT EXISTS vibe_entities_price_idx
ON vibe_entities ((metadata->>'avg_price'));

-- 4. B-tree index on core_category field (footwear/outerwear/etc)
CREATE INDEX IF NOT EXISTS vibe_entities_category_idx
ON vibe_entities ((metadata->>'core_category'));

-- ============================================
-- Verify indexes were created
-- ============================================

SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'vibe_entities'
  AND (indexname LIKE '%metadata%'
    OR indexname LIKE '%tier%'
    OR indexname LIKE '%price%'
    OR indexname LIKE '%category%')
ORDER BY indexname;

-- ============================================
-- Test queries (run after indexes are created)
-- ============================================

-- Test 1: Find all gem brands from France
SELECT entity_name, metadata
FROM vibe_entities
WHERE metadata->>'tier' = 'gem'
  AND metadata->'context_tags' ? 'france'
LIMIT 10;

-- Test 2: Find icon-tier footwear brands
SELECT entity_name, metadata
FROM vibe_entities
WHERE metadata @> '{"tier": "icon", "core_category": "footwear"}'::jsonb;

-- Test 3: Find affordable brands in low price segment
SELECT entity_name, metadata
FROM vibe_entities
WHERE metadata @> '{"tier": "affordable", "avg_price": "low"}'::jsonb
LIMIT 10;

-- Test 4: Find y2k gem brands from Italy
SELECT entity_name, metadata
FROM vibe_entities
WHERE metadata->>'tier' = 'gem'
  AND metadata->'context_tags' ? 'italy'
  AND metadata->'context_tags' ? 'y2k'
LIMIT 10;

-- Test 5: Tier distribution (should be fast with index)
SELECT
  metadata->>'tier' as tier,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 1) as percentage
FROM vibe_entities
WHERE metadata->>'tier' IS NOT NULL
GROUP BY metadata->>'tier'
ORDER BY count DESC;
