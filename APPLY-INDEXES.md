# Apply Metadata Indexes

After the backfill completes, apply the GIN indexes for fast metadata queries.

## Steps

1. Go to Supabase SQL Editor:
   https://supabase.com/dashboard/project/ymkigxqxwdwupcfcdfen/sql

2. Copy and paste the contents of:
   `supabase/migrations/20250116000000_add_metadata_gin_index.sql`

3. Click "Run" to execute

## What this does

Creates 4 indexes for fast querying:

- **GIN index** on entire `metadata` JSONB column (for complex queries)
- **B-tree index** on `tier` field (icon, gem, affordable, mainstream)
- **B-tree index** on `avg_price` field (low, mid, high, luxury)
- **B-tree index** on `core_category` field (footwear, outerwear, etc.)

## Example Queries After Indexing

```sql
-- Find all "gem" tier brands
SELECT entity_name, metadata
FROM vibe_entities
WHERE metadata->>'tier' = 'gem';

-- Find all affordable brands with French origin
SELECT entity_name, metadata
FROM vibe_entities
WHERE metadata->>'tier' = 'affordable'
  AND metadata->'context_tags' ? 'france';

-- Find all icon-tier footwear brands
SELECT entity_name, metadata
FROM vibe_entities
WHERE metadata @> '{"tier": "icon", "core_category": "footwear"}';
```

## Performance

Without indexes: ~100-500ms for metadata queries
With indexes: ~1-5ms for metadata queries

## Verification

After applying, verify indexes exist:

```sql
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'vibe_entities'
  AND indexname LIKE '%metadata%';
```
