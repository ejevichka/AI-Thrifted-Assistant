# 🚀 VibeDNA Search Architecture Setup

## Overview
This replaces the old OpenAI text-embedding approach with a style-based VibeDNA vector system.

## Step 1: Apply Database Migration

### Option A: Supabase Dashboard (Recommended)
1. Go to: https://supabase.com/dashboard/project/ymkigxqxwdwupcfcdfen/sql/new
2. Copy the entire contents of `supabase/migrations/20250111000000_vibe_entities.sql`
3. Paste into SQL Editor
4. Click "Run"
5. Verify success (should see "Success. No rows returned")

### Option B: Command Line
```bash
# If you have Supabase CLI installed
supabase db push

# Or run the apply script
npx tsx scripts/apply-vibe-migration.ts
```

## Step 2: Ingest Brand VibeDNA Vectors

### Using Sample Data (50 brands - for testing)
```bash
npx tsx scripts/ingest-vibe-matrix.ts --sample
```

### Using Full Data (934 brands - when ready)
```bash
npx tsx scripts/ingest-vibe-matrix.ts
```

Expected output:
```
✅ Success: 50/50 brands
📁 Source: data/vinted/brand-vibe-matrix-sample.json
🗄️  Table: vibe_entities
```

## Step 3: Test the API

### Test 1: Find Y2K brands
```bash
curl -X POST http://localhost:3000/api/diggy/search-by-vibe \
  -H "Content-Type: application/json" \
  -d '{"style_id": "y2k", "limit": 10}'
```

### Test 2: Find brands similar to "Cop Copine"
```bash
curl -X POST http://localhost:3000/api/diggy/search-by-vibe \
  -H "Content-Type: application/json" \
  -d '{"brand_name": "Cop Copine", "limit": 10}'
```

### Test 3: Multi-style search (Y2K + Grunge)
```bash
curl -X POST http://localhost:3000/api/diggy/search-by-vibe \
  -H "Content-Type: application/json" \
  -d '{"style_weights": {"y2k": 0.8, "grunge": 0.5}, "limit": 10}'
```

### Test 4: GET endpoint (simpler)
```bash
curl "http://localhost:3000/api/diggy/search-by-vibe?style_id=y2k&limit=10"
```

## Step 4: Verify Database

Run these SQL queries in Supabase SQL Editor:

```sql
-- Check table exists and has data
SELECT COUNT(*) FROM vibe_entities WHERE entity_type = 'brand';

-- View a sample brand
SELECT entity_name, metadata FROM vibe_entities LIMIT 5;

-- Test the search function
SELECT * FROM search_brands_by_style('y2k', 10);

-- Find brands similar to Cop Copine
SELECT * FROM find_similar_brands('Cop Copine', 10);
```

## Architecture Summary

### Old System (Deprecated)
```
User Query → OpenAI Embedding (1536-dim) → pgvector search → Brands
```

Problems:
- Expensive (API calls for every query)
- Slow (network latency)
- Semantic meaning lost in embedding space
- No interpretability

### New System (VibeDNA)
```
User Query (style_id) → Target Vector [0,0,1,0...] → pgvector search → Brands
                          ↑
                    24-dimensional
                    Pre-computed vectors
```

Benefits:
- ✅ Free (no API calls)
- ✅ Fast (in-database vector search)
- ✅ Interpretable (each dimension = a style)
- ✅ Precise (expert-curated style matching)

### Vector Structure
```
Brand "Cop Copine" = [
  0.0,  // casual
  0.0,  // formal
  0.0,  // sporty
  0.4,  // vintage
  0.0,  // bohemian
  0.9,  // y2k ← HIGH!
  0.1,  // grunge
  ...
  0.7,  // deconstructed ← HIGH!
  ...
  0.3   // officesiren
]
```

## Files Created

### Database
- `supabase/migrations/20250111000000_vibe_entities.sql` - Table + functions

### Scripts
- `scripts/generate-brand-vibe-matrix.ts` - LLM-powered vector generation
- `scripts/ingest-vibe-matrix.ts` - Load vectors into database
- `scripts/apply-vibe-migration.ts` - Helper to apply migration

### API
- `app/api/diggy/search-by-vibe/route.ts` - Search endpoint

### Data
- `data/vinted/brand-vibe-matrix-sample.json` - 50 brands (ready)
- `data/vinted/brand-vibe-matrix.json` - 934 brands (generating...)

## Next Steps

1. ✅ Apply migration
2. ✅ Ingest sample data
3. ✅ Test API endpoints
4. 🔄 Wait for full brand-vibe-matrix.json generation
5. 🔄 Ingest full data
6. 🔄 Integrate with main chat interface

## Troubleshooting

### Migration fails
- Check Supabase connection
- Verify pgvector extension is enabled
- Try running SQL directly in dashboard

### Ingestion fails
- Verify migration was applied successfully
- Check file paths are correct
- Ensure Supabase credentials in .env

### API returns no results
- Verify data was ingested (check database)
- Check style_id is valid (must match STYLE_IDS)
- Try lowering min_similarity threshold

### Search returns unexpected brands
- Review brand-vibe-matrix.json to see vector values
- Adjust LLM prompt in generate-brand-vibe-matrix.ts
- Re-generate and re-ingest
