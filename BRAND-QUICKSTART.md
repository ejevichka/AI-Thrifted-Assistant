# Brand Vibe-Alike System - Quick Start Guide

## What This Does

Automatically finds **affordable vintage alternatives** to expensive designer brands by matching aesthetic "vibes".

**Example:**
- User searches: "KNWLS jacket"
- System finds: Miss Sixty, Diesel (same y2k + moto-glam vibe, but €20-80 instead of €500)

## Files Created

```
data/vinted/
  ├── vibe-tags.json           # 40+ aesthetic tag vocabulary
  └── brands-classified.json   # 57 brands with vibe tags

app/api/vinted/chat/
  ├── brand-matcher.ts         # Brand matching service
  └── route.ts                 # Updated with brand matching

app/api/vinted/brand-match/
  └── route.ts                 # Brand matching API endpoint

scripts/
  ├── curate-brands.ts         # Interactive brand curation tool
  └── test-brand-matcher.ts    # Testing/demo script

docs/
  ├── BRAND-VIBE-SYSTEM.md     # Complete documentation
  └── BRAND-QUICKSTART.md      # This file
```

## Quick Test

### 1. Run the test script:
```bash
yarn test:brand-matcher
```

This will demonstrate:
- Finding vibe-alikes for KNWLS
- Searching by vibe tags (y2k, french_chic, gorpcore)
- Multi-brand recommendations
- Brand extraction from queries

### 2. Test the API:
```bash
# Start your dev server
yarn dev

# In another terminal, test the API
curl "http://localhost:3000/api/vinted/brand-match?brand=KNWLS"
```

### 3. Test in chat:
Open http://localhost:3000 and try:
- "Find me KNWLS style jacket"
- "Show me Y2K French brands"
- "I want gorpcore aesthetic"

## How It Works

### 1. Vibe Tags
40+ controlled vocabulary tags describing aesthetics:
- **Core:** minimalist, maximalist, avant_garde, streetwear, goth, grunge, punk...
- **Era:** y2k, 90s, 80s, vintage_classic
- **Micro-trends:** gorpcore, techwear, coquette, feral_chic, moto_glam...
- **Origin:** french_chic, italian_vintage, scandi_minimalism...

### 2. Brand Classification
Each brand has:
```json
{
  "brand": "KNWLS",
  "category": "Trendy/Designer",
  "vibeTags": ["y2k", "feral_chic", "moto_glam", "luxury_leather"],
  "priceRange": "high",
  "searchPriority": 5
}
```

### 3. Matching Algorithm
Uses Jaccard similarity:
```
match_score = shared_tags / total_unique_tags
```

Finds brands with highest overlap in vibe tags.

### 4. Search Query Generation
```typescript
// User: "KNWLS jacket"

// System generates:
[
  "KNWLS jacket",           // Original (€500)
  "Miss Sixty jacket",      // Vibe-alike (€30)
  "Diesel jacket"           // Vibe-alike (€50)
]
```

## Adding New Brands

### Interactive Mode:
```bash
yarn curate:brands
```

Follow the prompts:
1. Enter brand name
2. Select category (Trendy/Designer or Vintage/Affordable)
3. Select price range
4. Enter vibe tags (comma-separated)
5. Set search priority (1-5)
6. Save

### Batch Mode:
Prepare JSON:
```json
[
  {
    "brand": "Zara",
    "category": "Vintage/Affordable",
    "vibeTags": ["minimalist", "basics"],
    "priceRange": "low",
    "searchPriority": 3
  }
]
```

Run:
```bash
yarn curate:brands
# Select option 2 (Batch import)
# Paste JSON
```

## Current Database

**57 brands classified:**
- 27 Trendy/Designer (KNWLS, Acne Studios, Rick Owens, Arc'teryx...)
- 30 Vintage/Affordable (Miss Sixty, Diesel, COS, Carhartt WIP...)

**Top vibe tag clusters:**
- Y2K: KNWLS → Miss Sixty, Diesel, Morgan de Toi
- Minimalist: Acne Studios → COS, Helmut Lang, Everlane
- Streetwear: Supreme → Stüssy, Carhartt WIP, Champion
- Gorpcore: Arc'teryx → The North Face, Salomon, Patagonia

## API Reference

### GET /api/vinted/brand-match
Find vibe-alikes for a specific brand.

**Request:**
```bash
GET /api/vinted/brand-match?brand=KNWLS
```

**Response:**
```json
{
  "brand": { "name": "KNWLS", "category": "Trendy/Designer", ... },
  "vibeAlikeBrands": [
    { "brand": "Miss Sixty", "matchScore": 0.6, "sharedTags": ["y2k", "moto_glam"], ... }
  ],
  "suggestedSearchQueries": ["KNWLS jacket", "Miss Sixty jacket", ...]
}
```

### POST /api/vinted/brand-match
Find brands by vibe tags.

**Request:**
```bash
POST /api/vinted/brand-match
Content-Type: application/json

{
  "vibeTags": ["y2k", "french_chic"],
  "category": "Vintage/Affordable",
  "limit": 10
}
```

**Response:**
```json
{
  "matches": [
    { "brand": "Morgan de Toi", "matchScore": 0.8, "sharedTags": ["y2k", "french_chic"], ... }
  ]
}
```

## Usage in Chat

The brand matcher is automatically integrated into your chat route:

1. **Brand extraction:** Detects brand names in user queries
2. **Context enrichment:** Adds vibe-alike suggestions to LLM context
3. **Query generation:** LLM generates mixed trendy + affordable queries
4. **Product search:** Searches Vinted with all queries
5. **Results:** User sees mix of expensive + affordable options

## Examples

### Example 1: Direct Brand Search
```
User: "Find me KNWLS style jacket"

System:
1. Detects brand: KNWLS
2. Finds vibe-alikes: Miss Sixty, Diesel
3. Generates queries: "KNWLS jacket", "Miss Sixty jacket", "Diesel jacket"
4. Searches Vinted
5. Returns: 3 KNWLS (€500+), 12 Miss Sixty (€20-50), 8 Diesel (€30-80)
```

### Example 2: Aesthetic Search
```
User: "Show me gorpcore brands"

System:
1. Identifies vibe tag: gorpcore
2. Finds brands: Arc'teryx (trendy), The North Face, Salomon (affordable)
3. Generates queries: "Arc'teryx fleece", "North Face jacket", "Salomon shoes"
4. Searches Vinted
5. Returns: Mix of high-end and affordable gorpcore items
```

### Example 3: Multi-Brand Input
```
User: "I like KNWLS, Mugler, and Marine Serre"

System:
1. Extracts brands: KNWLS, Mugler, Marine Serre
2. Analyzes common tags: y2k, futurism, avant_garde
3. Recommends: Cop Copine, Diesel, Jean Paul Gaultier
4. Generates mixed queries
5. Returns: Blend of expensive + affordable futuristic Y2K items
```

## Best Practices

### Tagging Brands
- Use 3-5 tags max (most defining characteristics)
- Be specific: `y2k` + `moto_glam` better than just `trendy`
- Test matches after adding brands

### Curation Priority
1. Focus on brands frequently found on Vinted
2. Prioritize obvious vibe matches (e.g., Miss Sixty for Y2K)
3. Add niche micro-trends as they emerge

### Maintaining Quality
- Regularly test match API
- Update price ranges as trends change
- Remove brands that become unavailable on Vinted

## Troubleshooting

**"Brand not found"**
- Check spelling in brands-classified.json
- Brand name is case-insensitive but must match exactly

**"Low match scores"**
- Tags may be too generic
- Try more specific micro-trend tags
- Consider if brands truly share aesthetic

**"No results from search"**
- Check if brand actually exists on Vinted
- Lower searchPriority if rarely available
- Verify Vinted API is working

## Next Steps

1. **Test the system:**
   ```bash
   yarn test:brand-matcher
   ```

2. **Add your favorite brands:**
   ```bash
   yarn curate:brands
   ```

3. **Try it in chat:**
   - Start dev server: `yarn dev`
   - Go to http://localhost:3000
   - Search: "Find me [expensive brand] style"

4. **Expand the database:**
   - Add 100+ more brands
   - Create niche aesthetic clusters
   - Map trends to brands

## Resources

- **Full docs:** [BRAND-VIBE-SYSTEM.md](./BRAND-VIBE-SYSTEM.md)
- **Project overview:** [PROJECT.md](./PROJECT.md)
- **Main README:** [README.md](./README.md)

---

**Questions?** Check BRAND-VIBE-SYSTEM.md for detailed architecture and API docs.
