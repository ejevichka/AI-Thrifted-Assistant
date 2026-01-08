-- Migration: Add GIN index on metadata JSONB column for fast querying
-- This enables efficient filtering by tier, avg_price, context_tags, and core_category

-- Create GIN index on metadata JSONB column
-- This allows fast queries like:
--   WHERE metadata->>'tier' = 'gem'
--   WHERE metadata->'context_tags' ? 'france'
--   WHERE metadata @> '{"tier": "icon"}'
CREATE INDEX IF NOT EXISTS vibe_entities_metadata_gin_idx
ON vibe_entities
USING GIN (metadata);

-- Create indexes on frequently queried metadata fields for even faster queries
CREATE INDEX IF NOT EXISTS vibe_entities_tier_idx
ON vibe_entities ((metadata->>'tier'));

CREATE INDEX IF NOT EXISTS vibe_entities_price_idx
ON vibe_entities ((metadata->>'avg_price'));

CREATE INDEX IF NOT EXISTS vibe_entities_category_idx
ON vibe_entities ((metadata->>'core_category'));

-- Add comments for documentation
COMMENT ON INDEX vibe_entities_metadata_gin_idx IS
'GIN index on metadata JSONB for fast filtering by tier, price, tags, and category';

COMMENT ON INDEX vibe_entities_tier_idx IS
'B-tree index on tier field (icon, gem, affordable, mainstream) for fast tier filtering';

COMMENT ON INDEX vibe_entities_price_idx IS
'B-tree index on avg_price field (low, mid, high, luxury) for fast price filtering';

COMMENT ON INDEX vibe_entities_category_idx IS
'B-tree index on core_category field for fast category filtering';
