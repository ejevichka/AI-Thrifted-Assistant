# Brand Vibe-Alike Matching System

## Overview

The Brand Vibe-Alike System is the core innovation of DIGGY that helps users discover affordable vintage alternatives to trendy designer brands by matching aesthetic "vibes" using controlled vocabulary tags.

## The Problem It Solves

**User Challenge:**
- Users want the style of expensive brands like KNWLS, Mugler, or Acne Studios
- But can't afford $500+ items on second-hand marketplaces
- Don't know which affordable vintage brands share the same aesthetic

**Our Solution:**
Map every brand to aesthetic "vibe tags" and automatically suggest affordable alternatives that share the same DNA.

## System Architecture

### 1. Vibe Tag Vocabulary

A controlled vocabulary of 40+ aesthetic descriptors organized into categories:

#### Core Aesthetics (9 tags)
- `minimalist` - Clean lines, neutral colors, simplicity
- `maximalist` - Bold patterns, vibrant colors, eclectic
- `avant_garde` - Experimental, unconventional, artistic
- `bohemian` - Free-spirited, earthy, flowing
- `preppy` - Collegiate, polished, classic American
- `streetwear` - Urban, casual, hype-driven
- `goth` - Dark, moody, dramatic
- `grunge` - Raw, distressed, 90s Seattle
- `punk` - Rebellious, DIY, edgy

#### Era-Specific (4 tags)
- `y2k` - Early 2000s (1998-2005)
- `90s` - 1990s style
- `80s` - 1980s aesthetic
- `vintage_classic` - Timeless vintage pieces

#### Micro-Trends (15 tags)
- `gorpcore` - Outdoor gear as fashion
- `techwear` - Technical fabrics, urban utility
- `dark_academia` - Scholarly, moody, vintage collegiate
- `cottagecore` - Rural, romantic, pastoral
- `balletcore` - Ballet-inspired, delicate
- `coquette` - Feminine, playful, ribbons and lace
- `feral_chic` - Untamed elegance, raw sensuality
- `moto_glam` - Motorcycle-inspired, leather
- `space_age` - Futuristic, metallic, 60s sci-fi
- `quiet_luxury` - Understated wealth, quality over logos
- `old_money` - Inherited wealth aesthetic
- `deconstructed` - Taken apart and reassembled
- `bodycon` - Body-conscious, curve-hugging
- `futurism` - Forward-thinking, space-age
- `clubkid` - 90s NYC club scene, outrageous
- `darkwear` - All-black, technical, urban ninja

#### Origin/Style (9 tags)
- `italian_vintage` - Classic Italian brands
- `french_chic` - Parisian elegance
- `scandi_minimalism` - Nordic simplicity
- `japanese_streetwear` - Tokyo street style
- `japanese_minimalism` - Zen simplicity
- `harajuku` - Tokyo Harajuku district style
- `kfashion` - Korean fashion
- `denim_couture` - Denim expertise
- `luxury_leather` - High-end leather goods

#### Basics (2 tags)
- `basics` - Foundational wardrobe essentials
- `sporty` - Athletic-inspired

### 2. Brand Classification Database

Each brand is classified with:

```typescript
{
  brand: "KNWLS",
  category: "Trendy/Designer",
  vibeTags: ["y2k", "feral_chic", "moto_glam", "luxury_leather"],
  priceRange: "high",
  searchPriority: 5,
  matchesTrendy?: ["Mugler", "Diesel"] // For affordable brands
}
```

**Categories:**
- `Trendy/Designer` - High-end, current brands (what users aspire to)
- `Vintage/Affordable` - Second-hand, affordable brands (what users can actually buy)

**Price Ranges:**
- `low` - Under €30
- `low-medium` - €30-€60
- `medium` - €60-€120
- `medium-high` - €120-€250
- `high` - €250-€600
- `luxury` - €600+

**Search Priority:**
- 5 = Must include (anchor brands)
- 4 = High value alternatives
- 3 = Good options
- 2 = Secondary choices
- 1 = Rarely include

### 3. Brand Matcher Service

The `BrandMatcherService` provides intelligent brand matching:

#### Key Methods

**`findBrand(brandName: string)`**
Looks up a brand in the database (case-insensitive).

**`findVibeAlikeBrands(brandName: string, options)`**
Finds affordable/vintage brands that match the vibe of a trendy brand.

```typescript
const vibeAlikes = brandMatcher.findVibeAlikeBrands('KNWLS', {
  limit: 5,
  minScore: 0.2,
  category: 'Vintage/Affordable'
});

// Returns:
[
  {
    brand: "Miss Sixty",
    category: "Vintage/Affordable",
    matchScore: 0.6,
    sharedTags: ["y2k", "moto_glam"],
    priceRange: "low"
  },
  {
    brand: "Diesel",
    category: "Vintage/Affordable",
    matchScore: 0.55,
    sharedTags: ["y2k", "moto_glam", "denim_couture"],
    priceRange: "low-medium"
  }
]
```

**Match Score Calculation:**
Uses Jaccard similarity coefficient:
```
score = (shared_tags) / (total_unique_tags)
```

**`findBrandsByVibeTags(tags: string[], options)`**
Finds all brands that match specific vibe tags.

```typescript
const brands = brandMatcher.findBrandsByVibeTags(['y2k', 'french_chic'], {
  limit: 10,
  category: 'Vintage/Affordable'
});
```

**`generateAugmentedSearchQueries(brandName: string, itemType?: string)`**
Automatically generates search queries mixing trendy + affordable brands.

```typescript
const queries = brandMatcher.generateAugmentedSearchQueries('KNWLS', 'jacket', 3);

// Returns:
[
  "KNWLS jacket",
  "Miss Sixty jacket",
  "Diesel jacket"
]
```

**`recommendBrandsFromMultiple(brandNames: string[])`**
Recommends brands based on multiple input brands (averaging their vibes).

## How It Works: User Flow

### Example 1: User searches "KNWLS jacket"

1. **Query Analysis:**
   - System extracts brand: "KNWLS"
   - System extracts item: "jacket"

2. **Brand Lookup:**
   ```json
   {
     "brand": "KNWLS",
     "category": "Trendy/Designer",
     "vibeTags": ["y2k", "feral_chic", "moto_glam", "luxury_leather"]
   }
   ```

3. **Find Vibe-Alikes:**
   - Search for `Vintage/Affordable` brands with tags: y2k, moto_glam, etc.
   - Results: Miss Sixty (0.6 match), Diesel (0.55 match), Fornarina (0.4 match)

4. **Generate Queries:**
   ```
   - "KNWLS jacket"
   - "Miss Sixty jacket"
   - "Diesel jacket"
   ```

5. **Search Vinted:**
   - Execute all 3 queries in parallel
   - Deduplicate results
   - Return mixed results to user

6. **User Gets:**
   - Original KNWLS items (if available, €300-600)
   - Miss Sixty alternatives (€20-50)
   - Diesel alternatives (€30-80)
   - All sharing the same y2k, moto-glam vibe

### Example 2: User asks "Show me gorpcore brands"

1. **Tag Extraction:**
   - System identifies vibe tag: "gorpcore"

2. **Find Brands:**
   ```typescript
   brandMatcher.findBrandsByVibeTags(['gorpcore'], {
     category: 'all'
   });
   ```

3. **Results:**
   - Trendy: Arc'teryx, Stone Island
   - Affordable: The North Face, Carhartt WIP, Salomon, Patagonia

4. **Search Queries:**
   ```
   - "Arc'teryx fleece"
   - "The North Face jacket"
   - "Salomon hiking shoes"
   - "Patagonia vest"
   ```

## Integration with Chat AI

The brand matcher is integrated into the chat route:

```typescript
// In retrieveContext():
const extractedBrands = brandMatcher.extractBrandsFromQuery(question);

if (extractedBrands.length > 0) {
  extractedBrands.forEach(brandName => {
    const vibeAlikes = brandMatcher.findVibeAlikeBrands(brandName, { limit: 3 });
    // Add to context for LLM
  });
}
```

The LLM receives context like:
```
BRAND DATABASE MATCHES:

KNWLS (Trendy/Designer):
  Vibe Tags: y2k, feral_chic, moto_glam, luxury_leather
  Vibe-Alike Alternatives:
    - Miss Sixty (low): y2k, moto_glam
    - Diesel (low-medium): y2k, moto_glam, denim_couture
    - Fornarina (low): y2k, maximalist
```

The LLM then generates search queries that intelligently mix trendy + affordable brands.

## API Endpoints

### GET /api/vinted/brand-match?brand=KNWLS

Returns vibe-alike matches for a specific brand.

**Response:**
```json
{
  "brand": {
    "name": "KNWLS",
    "category": "Trendy/Designer",
    "vibeTags": ["y2k", "feral_chic", "moto_glam", "luxury_leather"],
    "priceRange": "high"
  },
  "vibeAlikeBrands": [
    {
      "brand": "Miss Sixty",
      "category": "Vintage/Affordable",
      "matchScore": 0.6,
      "sharedTags": ["y2k", "moto_glam"],
      "priceRange": "low"
    }
  ],
  "suggestedSearchQueries": [
    "KNWLS jacket",
    "Miss Sixty jacket",
    "Diesel jacket"
  ],
  "explanation": "When searching for KNWLS, we recommend also searching these affordable alternatives..."
}
```

### POST /api/vinted/brand-match

Find brands by vibe tags.

**Request:**
```json
{
  "vibeTags": ["y2k", "french_chic"],
  "category": "Vintage/Affordable",
  "limit": 10
}
```

**Response:**
```json
{
  "searchedTags": ["y2k", "french_chic"],
  "category": "Vintage/Affordable",
  "matches": [
    {
      "brand": "Morgan de Toi",
      "category": "Vintage/Affordable",
      "matchScore": 0.8,
      "sharedTags": ["y2k", "french_chic", "coquette"],
      "priceRange": "low"
    }
  ],
  "totalFound": 5
}
```

## Data Files

### `/data/vinted/vibe-tags.json`
Complete vocabulary of vibe tags with descriptions and keywords.

### `/data/vinted/brands-classified.json`
Database of 50+ classified brands with categories, tags, and price ranges.

### `/data/vinted/brands.json` (legacy)
Old format - being migrated to brands-classified.json.

## Curation Script

Use the interactive curation tool to add new brands:

```bash
yarn ts-node --project tsconfig.scripts.json scripts/curate-brands.ts
```

**Features:**
1. Interactive brand addition with validation
2. Batch import from JSON
3. View all brands
4. Search existing brands
5. Edit existing entries

**Example Session:**
```
=== BRAND CURATION TOOL ===

Enter brand name: Zara

Categories:
1. Trendy/Designer
2. Vintage/Affordable
Select category: 2

Price Ranges:
1. low
2. low-medium
...
Select price range: 1

Enter vibe tags (comma-separated): minimalist, basics, scandi_minimalism

Search priority (1-5, default 3): 3

=== BRAND PREVIEW ===
{
  "brand": "Zara",
  "category": "Vintage/Affordable",
  "vibeTags": ["minimalist", "basics", "scandi_minimalism"],
  "priceRange": "low",
  "searchPriority": 3
}

Save this brand? yes
✅ Brand "Zara" saved successfully!
```

## Current Brand Database

### Trendy/Designer Brands (27)
KNWLS, Acne Studios, Mugler, Ganni, Khaite, Sandro, Marine Serre, Jacquemus, Rick Owens, The Row, Loro Piana, Arc'teryx, Ottolinger, Yohji Yamamoto, Junya Watanabe, Maison Margiela, Comme des Garçons, Isabel Marant, Simone Rocha, Ader Error, Blumarine, Stone Island, Vivienne Westwood, Supreme, A Bathing Ape, BAPE, Corteiz

### Vintage/Affordable Brands (30)
Miss Sixty, Morgan de Toi, Cop Copine, Kookai, Diesel, Fornarina, JC de Castelbajac, Stüssy, Carhartt WIP, The North Face, Dr. Martens, Jean Paul Gaultier, Helmut Lang, Levi's, Salomon, Uniqlo, COS, Hysteric Glamour, Walter Van Beirendonck, Naf Naf, Guess, Tommy Hilfiger, Polo Ralph Lauren, Patagonia, Champion, Everlane, Arket, Reiss, Maje, Ba&sh, Free People

## Vibe Tag Examples

### Y2K Style Cluster
**Trendy:** KNWLS, Blumarine, Marine Serre, Mugler
**Affordable:** Miss Sixty, Diesel, Morgan de Toi, Kookai, Naf Naf, Guess, Fornarina

### Minimalist Cluster
**Trendy:** Acne Studios, The Row, Khaite, Jacquemus
**Affordable:** COS, Helmut Lang, Uniqlo, Everlane, Arket

### Streetwear Cluster
**Trendy:** Supreme, BAPE, Corteiz, Stone Island
**Affordable:** Stüssy, Carhartt WIP, Champion, Tommy Hilfiger

### Gorpcore Cluster
**Trendy:** Arc'teryx, Stone Island
**Affordable:** The North Face, Salomon, Patagonia, Carhartt WIP

### French Chic Cluster
**Trendy:** Jacquemus, Sandro, Isabel Marant
**Affordable:** Morgan de Toi, Kookai, Naf Naf, Maje, Ba&sh

## Future Enhancements

1. **AI-Powered Tag Suggestion**
   - Use GPT-4 to automatically suggest vibe tags for new brands
   - Analyze brand websites and social media for aesthetic signals

2. **User Feedback Loop**
   - Allow users to vote on brand-to-brand matches
   - Machine learning to improve match scores over time

3. **Dynamic Weighting**
   - Weight tags based on user search patterns
   - Seasonal tag boosting (e.g., boost "cottagecore" in spring)

4. **Brand Embeddings**
   - Generate vector embeddings for brands
   - Use semantic similarity instead of tag overlap

5. **Visual Similarity**
   - Analyze product images to find visual matches
   - Combine with vibe tags for multi-modal matching

6. **Price Trend Analysis**
   - Track price changes over time
   - Alert users when trendy brands become affordable

## Best Practices for Curation

### 1. Be Conservative with Tags
- Max 4-5 tags per brand
- Only use tags that truly define the brand's core aesthetic
- Avoid generic tags like "basics" unless it's the brand's primary identity

### 2. Focus on Searchable Matches
- Prioritize brands commonly found on Vinted/Depop
- Higher search priority (4-5) for frequently available brands

### 3. Test Matches
- After adding a brand, test the match API
- Ensure vibe-alikes actually make sense visually

### 4. Keep Price Ranges Updated
- Vintage brand prices fluctuate with trends
- Update as brands become more/less popular

### 5. Document Edge Cases
- Some brands span multiple categories (e.g., Jean Paul Gaultier)
- Choose the category based on what's most available second-hand

## Troubleshooting

### Brand not found in matches
- Check if brand is in `brands-classified.json`
- Verify vibeTags are from the official vocabulary
- Ensure category is exactly "Trendy/Designer" or "Vintage/Affordable"

### Low match scores
- May need to add more granular vibe tags
- Consider creating micro-trend tags for niche aesthetics

### Too many results
- Increase `minScore` threshold
- Add more specific tags to narrow down matches

---

**Status:** ✅ Fully Implemented
**Last Updated:** October 2025
**Maintainer:** Nat
