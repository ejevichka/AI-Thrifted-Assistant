# Brand Metadata Backfill - Status & Documentation

## Overview

Enriching 934 brands with metadata "passports" using AI-powered fashion curator "Diggy".

## Metadata Schema

Each brand receives 4 metadata fields:

### 1. `tier` (curation level)
- **icon**: Holy grail brands (Rick Owens, Margiela, Arc'teryx)
- **gem**: Hidden gems for diggers (Cop Copine, Save the Queen!, BELCCI, Julius)
- **affordable**: Quality affordable alternatives (COS, Arket, Uniqlo)
- **mainstream**: Regular mass market (Esprit, H&M, Zara)

### 2. `avg_price` (resale price segment on Vinted)
- **low**: up to $30
- **mid**: $30 - $100
- **high**: $100 - $400
- **luxury**: $400+

### 3. `context_tags` (1-3 tags)
Era/origin tags: "france", "italy", "japan", "usa", "uk", "scandi", "80s", "90s", "y2k", "2000s"

### 4. `core_category` (specialization)
- footwear
- outerwear
- denim
- knitwear
- accessories
- full_range

## Example Output

```json
{
  "Rick Owens": {
    "tier": "icon",
    "avg_price": "high",
    "context_tags": ["usa", "90s", "2000s"],
    "core_category": "full_range"
  },
  "Cop Copine": {
    "tier": "gem",
    "avg_price": "mid",
    "context_tags": ["france", "y2k", "90s"],
    "core_category": "full_range"
  }
}
```

## Scripts

### Test (5 brands)
```bash
npx tsx scripts/backfill-metadata-test.ts
```

### Full Backfill (~930 brands)
```bash
npx tsx scripts/backfill-metadata.ts
```

### Monitor Progress
```bash
# Check background process
ps aux | grep backfill-metadata

# Watch log output
tail -f nohup.out
```

## Performance

- **Rate**: ~2-3 brands per minute (with 1-1.5s delay between requests)
- **Total time**: ~6-8 hours for 930 brands
- **Success rate**: 100% (based on test batch)
- **Cost**: ~$0.50-1.00 (using gpt-4o-mini)

## Database Queries

After backfill completes:

```sql
-- Check completion status
SELECT
  COUNT(*) FILTER (WHERE metadata->>'tier' IS NOT NULL) as with_metadata,
  COUNT(*) FILTER (WHERE metadata->>'tier' IS NULL) as without_metadata,
  COUNT(*) as total
FROM vibe_entities
WHERE entity_type = 'brand';

-- Tier distribution
SELECT
  metadata->>'tier' as tier,
  COUNT(*) as count
FROM vibe_entities
WHERE entity_type = 'brand'
  AND metadata->>'tier' IS NOT NULL
GROUP BY metadata->>'tier'
ORDER BY count DESC;

-- Find all French gem brands
SELECT entity_name, metadata
FROM vibe_entities
WHERE entity_type = 'brand'
  AND metadata->>'tier' = 'gem'
  AND metadata->'context_tags' ? 'france'
LIMIT 20;
```

## Next Steps

1. ✅ Create backfill script
2. ✅ Test on 5 brands
3. 🔄 Run full backfill (in progress)
4. ⏳ Apply GIN indexes (see APPLY-INDEXES.md)
5. ⏳ Update search API to use metadata for filtering/ranking
6. ⏳ Add metadata to UI (brand badges, filters)

## Troubleshooting

### Check if backfill is still running
```bash
ps aux | grep "backfill-metadata"
```

### Restart if needed
```bash
# Kill existing process
pkill -f backfill-metadata

# Restart
npx tsx scripts/backfill-metadata.ts > backfill.log 2>&1 &
```

### Check for failed brands
The script automatically retries failed brands once. Check final output for any permanent failures.
