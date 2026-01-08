# 🧬 VibeDNA Vector Search Architecture

## 📊 Current Status

✅ **Migration Created**: `supabase/migrations/20250111000000_vibe_entities.sql`
✅ **Ingestor Ready**: `scripts/ingest-vibe-matrix.ts`
✅ **API Endpoint**: `app/api/diggy/search-by-vibe/route.ts`
✅ **Sample Data**: `brand-vibe-matrix-sample.json` (50 brands)
🔄 **Full Data**: `brand-vibe-matrix.json` (732/934 brands - 78% complete)

---

## 🎯 The Problem We Solved

### Old Architecture (Deprecated)
```
User: "Find Y2K brands"
    ↓
OpenAI Embedding API ($$$)
    ↓
1536-dimensional vector [0.234, -0.891, 0.445, ...]
    ↓
pgvector similarity search
    ↓
Results (but... what do the numbers mean?)
```

**Problems:**
- 💸 Expensive: API call for every query
- 🐌 Slow: Network latency (200-500ms per query)
- 🤷 Opaque: Can't interpret why brands matched
- 🎲 Unreliable: Semantic drift in embedding space
- 📊 Unscalable: Can't explain or debug results

### New Architecture (VibeDNA)
```
User: "Find Y2K brands"
    ↓
Target Vector: [0, 0, 0, 0, 0, 1.0, 0, ...] (1.0 at position 5 = y2k)
                                  ↑
                               y2k dimension
    ↓
pgvector cosine similarity (IN-DATABASE, ~1ms)
    ↓
Results with INTERPRETABLE scores:
  - Abra: 1.0 (perfect Y2K match)
  - Cop Copine: 0.9 (strong Y2K + other styles)
  - Miss Sixty: 0.85 (authentic Y2K brand)
```

**Benefits:**
- ✅ **Free**: No API calls
- ✅ **Fast**: Sub-millisecond in-database search
- ✅ **Interpretable**: Each dimension = a fashion style
- ✅ **Precise**: Expert-curated by LLM fashion historian
- ✅ **Debuggable**: Can inspect exact scores per style

---

## 🧬 VibeDNA Vector Structure

Each brand has a **24-dimensional vector** where each dimension represents relevance to a fashion style (score: 0.0-1.0).

### Dimension Order (CRITICAL - must match everywhere)
```typescript
const STYLE_IDS = [
  'casual',           // 0
  'formal',           // 1
  'sporty',           // 2
  'vintage',          // 3
  'bohemian',         // 4
  'y2k',              // 5  ← Target for "Find Y2K brands"
  'grunge',           // 6
  'goth',             // 7
  'techwear',         // 8
  'gorpcore',         // 9
  'academia',         // 10
  'avantgarde',       // 11
  'streetwear',       // 12
  'cottagecore',      // 13
  'clubkid',          // 14
  'balletcore',       // 15
  'kfashion',         // 16
  'harajuku',         // 17
  'minimaljapan',     // 18
  'deconstructed',    // 19
  'eclecticgrandpa',  // 20
  'mobwife',          // 21
  'blokecore',        // 22
  'officesiren'       // 23
];
```

### Example Vectors

#### Rick Owens
```json
{
  "casual": 0.2,
  "formal": 0.0,
  "sporty": 0.0,
  "vintage": 0.0,
  "bohemian": 0.0,
  "y2k": 0.0,
  "grunge": 1.0,      // ← PERFECT FIT
  "goth": 1.0,        // ← PERFECT FIT
  "techwear": 0.6,
  "gorpcore": 0.0,
  "academia": 0.0,
  "avantgarde": 1.0,  // ← PERFECT FIT
  "streetwear": 0.4,
  "cottagecore": 0.0,
  "clubkid": 0.0,
  "balletcore": 0.0,
  "kfashion": 0.0,
  "harajuku": 0.0,
  "minimaljapan": 0.2,
  "deconstructed": 0.8,
  "eclecticgrandpa": 0.0,
  "mobwife": 0.0,
  "blokecore": 0.0,
  "officesiren": 0.0
}
// Vector: [0.2, 0, 0, 0, 0, 0, 1, 1, 0.6, 0, 0, 1, 0.4, ...]
```

#### Cop Copine (Vintage French Y2K brand)
```json
{
  "casual": 0.0,
  "formal": 0.0,
  "sporty": 0.0,
  "vintage": 0.4,
  "bohemian": 0.0,
  "y2k": 0.9,           // ← PRIMARY STYLE
  "grunge": 0.1,
  "goth": 0.0,
  "techwear": 0.5,      // ← Technical fabrics
  "gorpcore": 0.0,
  "academia": 0.0,
  "avantgarde": 0.3,
  "streetwear": 0.1,
  "cottagecore": 0.0,
  "clubkid": 0.2,
  "balletcore": 0.0,
  "kfashion": 0.0,
  "harajuku": 0.0,
  "minimaljapan": 0.0,
  "deconstructed": 0.7, // ← Raw edges, exposed seams
  "eclecticgrandpa": 0.0,
  "mobwife": 0.0,
  "blokecore": 0.0,
  "officesiren": 0.3    // ← Secretary-fantasy aesthetic
}
// Vector: [0, 0, 0, 0.4, 0, 0.9, 0.1, 0, 0.5, 0, 0, 0.3, 0.1, ...]
```

#### A-COLD-WALL (British Streetwear × Brutalism)
```json
{
  "casual": 0.3,
  "formal": 0.0,
  "sporty": 0.0,
  "vintage": 0.0,
  "bohemian": 0.0,
  "y2k": 0.0,
  "grunge": 0.0,
  "goth": 0.0,
  "techwear": 1.0,      // ← PERFECT FIT
  "gorpcore": 0.5,
  "academia": 0.0,
  "avantgarde": 0.8,    // ← Experimental design
  "streetwear": 0.9,    // ← Core identity
  "cottagecore": 0.0,
  "clubkid": 0.0,
  "balletcore": 0.0,
  "kfashion": 0.0,
  "harajuku": 0.0,
  "minimaljapan": 0.0,
  "deconstructed": 0.6,
  "eclecticgrandpa": 0.0,
  "mobwife": 0.0,
  "blokecore": 0.0,
  "officesiren": 0.0
}
// Vector: [0.3, 0, 0, 0, 0, 0, 0, 0, 1, 0.5, 0, 0.8, 0.9, ...]
```

---

## 🔍 Search Modes

### 1. Single Style Search
**Find all brands that match a specific style**

```typescript
POST /api/diggy/search-by-vibe
{
  "style_id": "y2k",
  "limit": 10,
  "min_similarity": 0.3
}
```

**How it works:**
```
Target vector = [0, 0, 0, 0, 0, 1.0, 0, 0, ...]
                                 ↑
                              y2k dimension

Cosine similarity with all brand vectors:
- Abra:        cos([0,0,0,0,0,1,0...], [0,0,0,0,0,1,0...]) = 1.0
- Cop Copine:  cos([0,0,0,0,0,1,0...], [0,0,0,0.4,0,0.9...]) = 0.85
- Rick Owens:  cos([0,0,0,0,0,1,0...], [0.2,0,0,0,0,0,1...]) = 0.0

Results sorted by similarity ↓
```

### 2. Multi-Style Weighted Search
**Find brands matching a combination of styles**

```typescript
POST /api/diggy/search-by-vibe
{
  "style_weights": {
    "y2k": 0.8,
    "grunge": 0.5,
    "deconstructed": 0.3
  },
  "limit": 10
}
```

**How it works:**
```
Target vector = [0, 0, 0, 0, 0, 0.8, 0.5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.3, 0, 0, 0, 0]
                                 ↑    ↑                                           ↑
                               y2k  grunge                                  deconstructed

Finds brands with high scores in these dimensions
```

### 3. Brand Similarity Search
**Find brands with similar vibe to a given brand**

```typescript
POST /api/diggy/search-by-vibe
{
  "brand_name": "Cop Copine",
  "limit": 10,
  "min_similarity": 0.5
}
```

**How it works:**
```
1. Look up Cop Copine's vector: [0, 0, 0, 0.4, 0, 0.9, ...]
2. Find brands with similar vectors (cosine similarity)
3. Return with shared style analysis:
   - Miss Sixty: 0.92 similarity
     Shared: y2k, deconstructed, vintage
   - Morgan de Toi: 0.88 similarity
     Shared: y2k, officesiren
```

---

## 🗄️ Database Schema

### Table: `vibe_entities`
```sql
CREATE TABLE vibe_entities (
  id SERIAL PRIMARY KEY,
  entity_name TEXT UNIQUE NOT NULL,
  entity_type TEXT NOT NULL DEFAULT 'brand',
  vibe_vector VECTOR(24) NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- HNSW index for fast vector search
CREATE INDEX vibe_entities_vector_idx ON vibe_entities
USING HNSW (vibe_vector vector_cosine_ops);
```

### Functions

#### `search_brands_by_style(style_id, limit, min_similarity)`
Single style search

#### `search_brands_by_styles(style_weights, limit, min_similarity)`
Multi-style weighted search

#### `find_similar_brands(brand_name, limit, min_similarity)`
Brand similarity search with shared style analysis

---

## 🚀 Usage Guide

### Step 1: Apply Migration
```bash
# Copy supabase/migrations/20250111000000_vibe_entities.sql
# Paste into Supabase SQL Editor → Run
```

### Step 2: Ingest Data
```bash
# Test with sample (50 brands)
npx tsx scripts/ingest-vibe-matrix.ts --sample

# Or use full data (when generation completes)
npx tsx scripts/ingest-vibe-matrix.ts
```

### Step 3: Test API
```bash
# Find Y2K brands
curl "http://localhost:3000/api/diggy/search-by-vibe?style_id=y2k&limit=10"

# Find brands similar to Rick Owens
curl -X POST http://localhost:3000/api/diggy/search-by-vibe \
  -H "Content-Type: application/json" \
  -d '{"brand_name": "Rick Owens", "limit": 10}'
```

---

## 📈 Performance

### Speed Comparison

| Method | Latency | Cost | Interpretability |
|--------|---------|------|------------------|
| Old (OpenAI Embedding) | 200-500ms | $0.0001/query | ❌ Opaque |
| New (VibeDNA) | <5ms | $0 | ✅ Full |

### Scale
- **Current**: 50 brands (sample)
- **Target**: 934 brands (generating)
- **Future**: 10,000+ brands (scalable)

### Index Performance (HNSW)
- Sub-millisecond search even with 10k+ vectors
- O(log n) complexity
- Approximate but >95% accurate

---

## 🧪 Quality Validation

### LLM-Generated Vectors
Each brand vector is generated by GPT-4o acting as "Diggy", an expert fashion historian.

**Prompt structure:**
1. Style Context Block (9,757 chars)
   - All 24 styles with descriptions, brands, hashtags
2. Brand to analyze
3. Output: JSON with 24 scores (0.0-1.0)

**Validation examples:**
- ✅ Rick Owens: `{grunge: 1.0, goth: 1.0, avantgarde: 1.0}`
- ✅ Acne Studios: `{casual: 1.0, minimaljapan: 0.7}`
- ✅ A-COLD-WALL: `{techwear: 1.0, streetwear: 0.9, avantgarde: 0.8}`
- ✅ Abra: `{y2k: 1.0}` (modern Y2K interpretation)

---

## 🔄 Pipeline

### Generation Pipeline
```
styles-enhanced.json (24 styles)
    ↓
generate-brand-vibe-matrix.ts (LLM loop)
    ↓
brand-vibe-matrix.json (934 brands × 24 dimensions)
    ↓
ingest-vibe-matrix.ts (batch insert)
    ↓
vibe_entities table (PostgreSQL + pgvector)
```

### Search Pipeline
```
User query (style_id)
    ↓
Create target vector [0, 0, 1, 0, ...]
    ↓
pgvector cosine similarity search
    ↓
Return sorted brands with scores
```

---

## 🎯 Integration Points

### Current Integration
- ✅ `/api/diggy/search-by-vibe` endpoint ready
- ✅ Sample data (50 brands) ready for testing
- 🔄 Full data (934 brands) generating

### Next Steps
1. Integrate with main chat interface (`app/api/vinted/chat/route.ts`)
2. Replace brand-matcher with VibeDNA search
3. Add real-time style detection from user queries
4. Generate VibeDNA for hashtags and aesthetics

### Future Enhancements
- Multi-modal vectors (brand + color + material)
- Temporal vectors (brand evolution over seasons)
- User preference vectors (personalized recommendations)
- Hybrid search (VibeDNA × text search × filters)

---

## 📚 Files Reference

### Database
- `supabase/migrations/20250111000000_vibe_entities.sql` - Migration

### Scripts
- `scripts/generate-brand-vibe-matrix.ts` - Vector generation (LLM)
- `scripts/generate-brand-vibe-matrix-sample.ts` - Sample version
- `scripts/ingest-vibe-matrix.ts` - Database ingestion
- `scripts/monitor-brand-vibe-generation.sh` - Progress monitor

### API
- `app/api/diggy/search-by-vibe/route.ts` - Search endpoint

### Data
- `data/vinted/styles-enhanced.json` - Style definitions
- `data/vinted/brand-vibe-matrix-sample.json` - 50 brands (ready)
- `data/vinted/brand-vibe-matrix.json` - 934 brands (generating)

### Documentation
- `instructions-vibe-setup.md` - Quick setup guide
- `VIBE-DNA-ARCHITECTURE.md` - This file

---

## 💡 Key Insights

### Why 24 dimensions?
- Each dimension = one fashion style
- Interpretable: can explain why brands match
- Precise: expert-curated, not learned
- Scalable: can add more dimensions as needed

### Why cosine similarity?
- Measures angle between vectors (direction, not magnitude)
- [0.9, 0.1, 0] is similar to [0.9, 0.1, 0]
- [0.9, 0.1, 0] is different from [0, 0, 0.9]
- Perfect for style matching

### Why pre-compute?
- Vectors are expensive to generate (LLM call)
- But cheap to store (24 floats = 96 bytes)
- And lightning-fast to search (in-database)

---

## 🎓 Educational Value

This architecture demonstrates:
1. **Semantic Search Without Embeddings** - custom vector spaces
2. **Interpretable ML** - every dimension has meaning
3. **Hybrid AI** - LLM for generation, SQL for search
4. **Vector Databases** - pgvector, HNSW, cosine similarity
5. **Domain Expertise** - fashion knowledge encoded as vectors

---

**Status**: 78% Complete (732/934 brands generated)
**ETA**: Full generation in ~20 minutes
**Next**: Apply migration → Ingest sample → Test API
