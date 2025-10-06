# Brand Matching Integration Guide

## Overview

This guide explains how the Brand Vibe-Alike Matching System is integrated into the chat route to improve search quality and user experience.

## Integration Architecture

### High-Level Flow

```
User Query
    ↓
retrieveContext() Node
    ↓
1. Extract Brands from query
2. Find Vibe-Alike matches
3. Detect Vibe Tags in query
4. Build rich context with brand suggestions
    ↓
generateSearchQueries() Node
    ↓
Enhanced LLM Prompt with:
- Brand matches
- Vibe-alike alternatives
- Suggested search queries
- Smart instructions
    ↓
LLM generates optimized search queries
    ↓
Frontend executes searches on Vinted
    ↓
User gets mix of expensive + affordable results
```

## Key Integration Points

### 1. Brand Extraction (`retrieveContext` function)

**Location:** `app/api/vinted/chat/route.ts:107-168`

**What it does:**
```typescript
const extractedBrands = brandMatcher.extractBrandsFromQuery(question);
```

- Scans user query for brand names
- Matches against 57-brand database (case-insensitive)
- Returns array of found brands

**Example:**
```
Input: "Find me KNWLS and Acne Studios jackets"
Output: ["KNWLS", "Acne Studios"]
```

### 2. Vibe-Alike Discovery

**Location:** `app/api/vinted/chat/route.ts:125-150`

**What it does:**
```typescript
const vibeAlikes = brandMatcher.findVibeAlikeBrands(brandName, {
    limit: 5,
    minScore: 0.2
});
```

For each extracted brand:
- Looks up brand in database
- Finds top 5 affordable alternatives using Jaccard similarity
- Calculates match scores based on shared vibe tags
- Generates example search queries

**Context Output:**
```
KNWLS:
  Category: Trendy/Designer
  Vibe Tags: y2k, feral_chic, moto_glam, luxury_leather
  Price Range: high

  💡 AFFORDABLE VIBE-ALIKES:
    1. Miss Sixty
       - Match: 60% (y2k, moto_glam)
       - Price: low
    2. Diesel
       - Match: 55% (y2k, moto_glam, denim_couture)
       - Price: low-medium

  📝 SUGGESTED SEARCH QUERIES:
    1. "KNWLS"
    2. "Miss Sixty"
    3. "Diesel"
```

### 3. Vibe Tag Detection

**Location:** `app/api/vinted/chat/route.ts:170-229`

**What it does:**
```typescript
const vibeTagKeywords = ['y2k', '90s', 'minimalist', 'streetwear', 'gorpcore', ...];
vibeTagKeywords.forEach(keyword => {
    if (queryLower.includes(keyword)) {
        detectedVibeTags.push(keyword);
    }
});
```

- Scans query for aesthetic keywords
- Maps natural language to vibe tags
  - "french" → `french_chic`
  - "scandinavian" → `scandi_minimalism`
  - "japanese" → `japanese_streetwear`, `japanese_minimalism`

**When triggered:**
```
Input: "Show me Y2K French brands"
Detected: ["y2k", "french_chic"]
```

Then finds all brands matching those tags:
```typescript
const matchingBrands = brandMatcher.findBrandsByVibeTags(
    detectedVibeTags,
    { limit: 10, category: 'all' }
);
```

**Context Output:**
```
=== BRANDS MATCHING YOUR VIBE ===

  🌟 TRENDY/DESIGNER OPTIONS:
    1. Jacquemus (french_chic, minimalist, coquette)
    2. Sandro (french_chic, preppy)

  💰 AFFORDABLE/VINTAGE OPTIONS:
    1. Morgan de Toi (y2k, french_chic, coquette) - low
    2. Kookai (90s, y2k, french_chic, minimalist) - low
    3. Naf Naf (y2k, french_chic, 90s) - low

  📝 RECOMMENDED SEARCHES:
    1. "Morgan de Toi y2k"
    2. "Kookai y2k"
    3. "Naf Naf y2k"
```

### 4. Affordable Brand Suggestions

**Location:** `app/api/vinted/chat/route.ts:153-165`

**What it does:**
When user searches for an affordable brand (e.g., "Diesel jeans"), suggests similar affordable options:

```typescript
if (brand.category === 'Vintage/Affordable') {
    const similarAffordable = brandMatcher.findBrandsByVibeTags(
        brand.vibeTags,
        { limit: 3, category: 'Vintage/Affordable' }
    ).filter(b => b.brand !== brand.brand);
}
```

**Context Output:**
```
Diesel:
  Category: Vintage/Affordable
  Vibe Tags: y2k, denim_couture, moto_glam, grunge

  🔍 SIMILAR AFFORDABLE BRANDS:
    1. Miss Sixty (y2k, italian_vintage, denim_couture)
    2. Levi's (basics, denim_couture, vintage_classic)
```

### 5. Smart Context Instructions

**Location:** `app/api/vinted/chat/route.ts:250-256`

**What it does:**
Adds dynamic instructions to the LLM based on what was detected:

```typescript
if (extractedBrands.length > 0) {
    combinedContext += `⚡ INSTRUCTION: User mentioned ${extractedBrands.join(', ')}. Include BOTH the original brand AND at least 2-3 affordable vibe-alike alternatives in your search queries.`;
}

if (detectedVibeTags.length > 0) {
    combinedContext += `⚡ INSTRUCTION: User wants ${detectedVibeTags.join(', ')} style. Use the brands listed above that match these vibes.`;
}
```

These instructions guide the LLM to use the brand matches we've already found.

### 6. Enhanced LLM Prompt

**Location:** `app/api/vinted/chat/route.ts:24-138`

The prompt has been completely rewritten to:

**Key Changes:**

1. **Personality:** "You are DIGGY, a smart fashion discovery AI..."
   - Clear identity and mission
   - Emphasizes affordability

2. **Vibe-Alike System Explanation:**
   ```
   When you see BRAND DATABASE MATCHES in the CONTEXT:
   1. User mentioned a brand
   2. I've found AFFORDABLE VIBE-ALIKES
   3. YOU MUST include both original + vibe-alikes
   ```

3. **Clear Examples:**
   ```
   User: "Find me a KNWLS jacket"
   Context: KNWLS → Miss Sixty (60%), Diesel (55%)
   Response: "Searching Vinted and Depop for: KNWLS jacket, Miss Sixty jacket, Diesel jacket"
   ```

4. **Search Query Rules:**
   - Always mix price points (1-2 trendy + 2-4 affordable)
   - Use suggested queries from context
   - Add item types to all queries
   - Format: "Brand + Item"

5. **Conversation Flow Decision Tree:**
   - IF brand + item → immediate search
   - IF brand only → ask for item or search
   - IF vibe only → use matched brands
   - IF vague → ask clarifying questions

6. **Quality Checklist:**
   ```
   ✅ Include original brand?
   ✅ Include 2-3 vibe-alikes?
   ✅ Add item type?
   ✅ Simple queries?
   ✅ Start with "Searching Vinted and Depop for:"?
   ```

## User Experience Examples

### Example 1: Brand Search with Item

**User Input:**
```
"Find me a KNWLS jacket"
```

**System Processing:**
1. `extractBrandsFromQuery()` finds: ["KNWLS"]
2. Looks up KNWLS → Trendy/Designer, tags: [y2k, feral_chic, moto_glam]
3. Finds vibe-alikes: Miss Sixty (60% match), Diesel (55%)
4. Builds context with matches + suggested queries
5. Adds instruction: "Include BOTH KNWLS AND vibe-alikes"

**LLM Response:**
```
Searching Vinted and Depop for: KNWLS jacket, Miss Sixty jacket, Diesel jacket
```

**Frontend:**
- Searches Vinted for all 3 queries
- Deduplicates results
- Returns: Mix of KNWLS (€500), Miss Sixty (€30), Diesel (€50)

**User Gets:**
- Original expensive option (aspiration)
- Affordable alternatives with same vibe (reality)

---

### Example 2: Vibe Search without Brand

**User Input:**
```
"Show me Y2K French brands"
```

**System Processing:**
1. No brands extracted
2. Detects vibe tags: ["y2k", "french_chic"]
3. Searches brand database for matches
4. Finds:
   - Trendy: Jacquemus, Sandro
   - Affordable: Morgan de Toi, Kookai, Naf Naf
5. Builds context with brand lists
6. Generates suggested queries
7. Adds instruction: "User wants y2k, french_chic style"

**LLM Response:**
```
Searching Vinted and Depop for: Morgan de Toi y2k, Kookai y2k, Naf Naf y2k, Jacquemus
```

**User Gets:**
- 3 affordable French Y2K brands (€20-40 each)
- 1 trendy option for inspiration (€200+)

---

### Example 3: Affordable Brand with Similar Options

**User Input:**
```
"Find me Diesel jeans"
```

**System Processing:**
1. Extracts brand: ["Diesel"]
2. Looks up: Diesel → Vintage/Affordable
3. Since it's already affordable, finds SIMILAR affordable brands
4. Finds: Miss Sixty, Levi's (share denim_couture tag)
5. Builds context with similar options

**LLM Response:**
```
Searching Vinted and Depop for: Diesel jeans, Miss Sixty jeans, Levi's jeans
```

**User Gets:**
- Original request (Diesel)
- Alternative affordable denim brands
- All in €20-60 range

---

### Example 4: Multiple Brands

**User Input:**
```
"I like KNWLS, Mugler, and Marine Serre"
```

**System Processing:**
1. Extracts: ["KNWLS", "Mugler", "Marine Serre"]
2. Looks up all 3 brands
3. Finds vibe-alikes for each
4. Common tags: y2k, futurism, avant_garde
5. Recommends: Cop Copine, Diesel, Jean Paul Gaultier

**LLM Response:**
```
Searching Vinted and Depop for: KNWLS, Mugler, Marine Serre, Cop Copine, Diesel, Jean Paul Gaultier
```

**User Gets:**
- Original 3 trendy brands (€300-600)
- 3 affordable alternatives (€30-80)
- All with futuristic Y2K vibe

---

### Example 5: Gorpcore Style

**User Input:**
```
"I want gorpcore aesthetic"
```

**System Processing:**
1. Detects vibe tag: ["gorpcore"]
2. Finds brands:
   - Trendy: Arc'teryx, Stone Island
   - Affordable: The North Face, Salomon, Patagonia, Carhartt WIP
3. Prioritizes affordable options

**LLM Response:**
```
Searching Vinted and Depop for: The North Face fleece, Salomon hiking, Patagonia vest, Arc'teryx jacket
```

**User Gets:**
- 3 affordable outdoor brands (€40-120)
- 1 trendy option (€200+)
- All with gorpcore aesthetic

## Context Structure

The final context sent to the LLM is structured as:

```
=== AESTHETIC GUIDE ===
[Traditional aesthetic context from AestheticService]

=== BRAND DATABASE MATCHES ===
[Only appears if brands were mentioned]

Brand Name:
  Category: Trendy/Designer or Vintage/Affordable
  Vibe Tags: tag1, tag2, tag3
  Price Range: low/medium/high/luxury

  💡 AFFORDABLE VIBE-ALIKES:
    1. Alternative Brand (Match: X%, shared tags)

  📝 SUGGESTED SEARCH QUERIES:
    1. "Brand item"
    2. "Alternative item"

=== BRANDS MATCHING YOUR VIBE ===
[Only appears if vibe tags detected but no brands]

  🌟 TRENDY/DESIGNER OPTIONS:
    1. Brand (tags)

  💰 AFFORDABLE/VINTAGE OPTIONS:
    1. Brand (tags) - price

  📝 RECOMMENDED SEARCHES:
    1. "Brand vibe"

=== STYLE DATABASE ===
[Additional style metadata]

⚡ INSTRUCTION: [Dynamic guidance based on query type]
```

## Performance Optimizations

### 1. Context Size Management
- Reduced style data: 600 chars (was 1000)
- Smart brand filtering: Only include relevant matches
- Limit vibe-alike results: Top 5 per brand

### 2. Early Query Generation
- Generate suggested queries during context retrieval
- LLM can use these directly or adapt them
- Reduces LLM processing time

### 3. Structured Context
- Clear section headers (===)
- Emoji markers for quick scanning
- Numbered lists for easy reference

### 4. Smart Instructions
- Dynamic based on query type
- Direct orders to LLM
- Reduces hallucination

## Error Handling

### Brand Not Found
```typescript
const brand = brandMatcher.findBrand(brandName);
if (brand) {
    // Add to context
} else {
    // Silently skip, don't break the flow
}
```

### No Matches
```typescript
const vibeAlikes = brandMatcher.findVibeAlikeBrands(brandName, { minScore: 0.2 });
if (vibeAlikes.length > 0) {
    // Add vibe-alikes
}
// If empty, context just shows brand info without alternatives
```

### Edge Runtime Compatibility
- All matching logic runs in Edge Runtime
- No file system access during matching
- JSON imports are static (bundled at build time)

## Testing Integration

### 1. Unit Test Brand Extraction
```bash
yarn test:brand-matcher
```

### 2. Test in Chat Interface
```bash
yarn dev
```

Try these queries:
- "Find me KNWLS jacket" (brand + item)
- "Show me KNWLS style" (brand only)
- "I want Y2K French brands" (vibe tags)
- "Show me gorpcore" (aesthetic)
- "Help me find clothes" (vague)

### 3. Verify Context in Logs
Check console for:
```
Extracted brands: ["KNWLS"]
Detected vibe tags: ["y2k", "french_chic"]
Suggested queries: ["KNWLS jacket", "Miss Sixty jacket"]
Context length: 2453
```

### 4. Test API Directly
```bash
curl http://localhost:3000/api/vinted/brand-match?brand=KNWLS
```

## Monitoring & Analytics

### Key Metrics to Track

1. **Brand Extraction Rate:**
   - % of queries with brands detected
   - Most mentioned brands

2. **Vibe Tag Detection:**
   - % of queries with vibe tags detected
   - Most common vibe tags

3. **Match Quality:**
   - Average match scores
   - % queries with >3 vibe-alikes

4. **Search Diversity:**
   - Mix of trendy vs affordable in results
   - Brand variety per search

### Logging Strategy

**Current logs:**
```typescript
console.log("Found brands in query:", extractedBrands);
console.log("Detected vibe tags:", detectedVibeTags);
console.log("Suggested queries:", suggestedQueries);
```

**Recommended additions:**
```typescript
// Track brand mention frequency
logEvent('brand_mentioned', { brand: brandName });

// Track vibe tag usage
logEvent('vibe_tag_detected', { tags: detectedVibeTags });

// Track match quality
logEvent('vibe_match_quality', { avgScore: 0.55, count: 3 });
```

## Future Enhancements

### 1. Item Type Extraction
Currently relies on LLM to extract "jacket", "jeans", etc.

**Enhancement:**
```typescript
function extractItemType(query: string): string | null {
    const itemTypes = ['jacket', 'jeans', 'dress', 'skirt', 'top', 'shoes', ...];
    for (const item of itemTypes) {
        if (query.toLowerCase().includes(item)) return item;
    }
    return null;
}
```

Use in `generateAugmentedSearchQueries()`:
```typescript
const itemType = extractItemType(question);
const queries = brandMatcher.generateAugmentedSearchQueries(brandName, itemType, 3);
```

### 2. Multi-Brand Merging
When multiple brands mentioned, merge their vibe-alikes:

```typescript
if (extractedBrands.length > 1) {
    const combined = brandMatcher.recommendBrandsFromMultiple(extractedBrands);
    // Add to context
}
```

### 3. Context Caching
Cache brand matches for repeated queries:

```typescript
const contextCache = new Map<string, string>();
const cacheKey = extractedBrands.join(',') + detectedVibeTags.join(',');
if (contextCache.has(cacheKey)) {
    return { context: contextCache.get(cacheKey) };
}
```

### 4. User Preference Learning
Track which vibe-alikes users actually click:

```typescript
// When user clicks product
logEvent('product_clicked', {
    originalBrand: 'KNWLS',
    clickedBrand: 'Miss Sixty',
    matchScore: 0.6
});

// Boost match scores for frequently clicked pairs
```

### 5. Dynamic Match Threshold
Adjust `minScore` based on query specificity:

```typescript
const minScore = extractedBrands.length > 1 ? 0.3 : 0.2; // Higher threshold for multiple brands
```

## Troubleshooting

### Issue: LLM not using vibe-alikes

**Check:**
1. Are brands extracted? Check logs: "Extracted brands: []"
2. Is context building? Check: "Context length: X"
3. Is instruction added? Look for "⚡ INSTRUCTION:"

**Fix:**
Add more explicit instruction or examples to prompt.

### Issue: Too many/few results

**Adjust:**
```typescript
// In retrieveContext():
const vibeAlikes = brandMatcher.findVibeAlikeBrands(brandName, {
    limit: 5, // Increase/decrease
    minScore: 0.2 // Raise to be more selective
});
```

### Issue: Wrong brand matches

**Check brand database:**
```bash
yarn test:brand-matcher
```

Look for brand entry:
- Are vibe tags accurate?
- Is category correct?
- Should match score be higher?

**Fix:**
```bash
yarn curate:brands
# Update the brand's vibe tags
```

---

**Status:** ✅ Fully Integrated
**Last Updated:** October 2025
**Next Review:** After 100+ real user queries
