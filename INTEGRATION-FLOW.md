# Brand Matching Integration Flow Diagram

## Complete User Journey: "Find me KNWLS jacket"

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER SENDS MESSAGE                           │
│                   "Find me KNWLS jacket"                        │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│              POST /api/vinted/chat                              │
│  (app/api/vinted/chat/route.ts:212)                            │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                 LangGraph Workflow Starts                       │
│                    START Node                                   │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│           ⚡ NODE: retrieveContext()                            │
│  (app/api/vinted/chat/route.ts:97-269)                         │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 1: Extract Brands from Query                             │
│  ────────────────────────────────────────────────────────────  │
│  brandMatcher.extractBrandsFromQuery("Find me KNWLS jacket")   │
│                                                                 │
│  ➜ Scans query for brand names                                 │
│  ➜ Matches against 57-brand database                           │
│                                                                 │
│  Result: ["KNWLS"] ✅                                           │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 2: Look Up Brand Details                                 │
│  ────────────────────────────────────────────────────────────  │
│  brandMatcher.findBrand("KNWLS")                               │
│                                                                 │
│  Found:                                                         │
│  {                                                              │
│    brand: "KNWLS",                                              │
│    category: "Trendy/Designer",                                 │
│    vibeTags: ["y2k", "feral_chic", "moto_glam"],               │
│    priceRange: "high"                                           │
│  }                                                              │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 3: Find Vibe-Alike Alternatives                          │
│  ────────────────────────────────────────────────────────────  │
│  brandMatcher.findVibeAlikeBrands("KNWLS", {                   │
│      limit: 5,                                                  │
│      minScore: 0.2                                              │
│  })                                                             │
│                                                                 │
│  Algorithm: Jaccard Similarity                                 │
│  ➜ Compare KNWLS tags with all Vintage/Affordable brands       │
│  ➜ Score = shared_tags / total_unique_tags                     │
│                                                                 │
│  Results:                                                       │
│  1. Miss Sixty: 0.60 (shares: y2k, moto_glam)                  │
│  2. Diesel: 0.55 (shares: y2k, moto_glam, denim_couture)       │
│  3. Fornarina: 0.40 (shares: y2k, maximalist)                  │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 4: Generate Suggested Search Queries                     │
│  ────────────────────────────────────────────────────────────  │
│  brandMatcher.generateAugmentedSearchQueries(                  │
│      "KNWLS",                                                   │
│      undefined,  // item type extracted from context           │
│      3           // max brands                                 │
│  )                                                              │
│                                                                 │
│  Generated:                                                     │
│  ["KNWLS", "Miss Sixty", "Diesel"]                             │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 5: Build Rich Context for LLM                            │
│  ────────────────────────────────────────────────────────────  │
│                                                                 │
│  combinedContext =                                              │
│                                                                 │
│  === AESTHETIC GUIDE ===                                        │
│  [Traditional aesthetic context from AestheticService]          │
│                                                                 │
│  === BRAND DATABASE MATCHES ===                                │
│                                                                 │
│  KNWLS:                                                         │
│    Category: Trendy/Designer                                    │
│    Vibe Tags: y2k, feral_chic, moto_glam, luxury_leather       │
│    Price Range: high                                            │
│                                                                 │
│    💡 AFFORDABLE VIBE-ALIKES:                                   │
│      1. Miss Sixty                                              │
│         - Match: 60% (y2k, moto_glam)                           │
│         - Price: low                                            │
│      2. Diesel                                                  │
│         - Match: 55% (y2k, moto_glam, denim_couture)            │
│         - Price: low-medium                                     │
│      3. Fornarina                                               │
│         - Match: 40% (y2k, maximalist)                          │
│         - Price: low                                            │
│                                                                 │
│    📝 SUGGESTED SEARCH QUERIES:                                 │
│      1. "KNWLS"                                                 │
│      2. "Miss Sixty"                                            │
│      3. "Diesel"                                                │
│                                                                 │
│  === STYLE DATABASE ===                                         │
│  [Additional style metadata]                                    │
│                                                                 │
│  ⚡ INSTRUCTION: User mentioned KNWLS. Include BOTH the         │
│  original brand AND at least 2-3 affordable vibe-alike         │
│  alternatives in your search queries.                           │
│                                                                 │
│  Context Length: 2,453 characters                               │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 6: Detect Vibe Tags (Parallel Process)                   │
│  ────────────────────────────────────────────────────────────  │
│  Check query for vibe keywords:                                 │
│  ['y2k', '90s', 'minimalist', 'streetwear', 'gorpcore', ...]   │
│                                                                 │
│  Query: "Find me KNWLS jacket"                                  │
│  ➜ No vibe keywords detected                                    │
│                                                                 │
│  Result: [] (empty - brand search, not vibe search)            │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  Return from retrieveContext()                                  │
│  ────────────────────────────────────────────────────────────  │
│  {                                                              │
│    context: [2,453 char rich context string],                  │
│    question: "Find me KNWLS jacket",                            │
│    chat_history: ""                                             │
│  }                                                              │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│           ⚡ NODE: generateSearchQueries()                      │
│  (app/api/vinted/chat/route.ts:271-178)                        │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 7: Build LLM Prompt                                      │
│  ────────────────────────────────────────────────────────────  │
│  ChatPromptTemplate.fromTemplate(FASHION_ASSISTANT_TEMPLATE)   │
│                                                                 │
│  Injects:                                                       │
│  - {context}: The 2,453 char context with brand matches        │
│  - {chat_history}: Previous messages                           │
│  - {question}: "Find me KNWLS jacket"                          │
│                                                                 │
│  Full prompt sent to GPT-4o-mini:                               │
│  ──────────────────────────────────────────────────────────   │
│  You are DIGGY, a smart fashion discovery AI...                │
│  [Full enhanced template with examples and rules]              │
│                                                                 │
│  CONTEXT:                                                       │
│  [The rich context from Step 5]                                 │
│                                                                 │
│  USER'S REQUEST:                                                │
│  Find me KNWLS jacket                                           │
│                                                                 │
│  RESPONSE:                                                      │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 8: GPT-4o-mini Processing                                │
│  ────────────────────────────────────────────────────────────  │
│  LLM reads:                                                     │
│  ✅ User wants KNWLS jacket                                     │
│  ✅ KNWLS = Trendy/Designer, expensive                          │
│  ✅ Context provides vibe-alikes: Miss Sixty, Diesel            │
│  ✅ Instruction says: Include BOTH original + alternatives      │
│  ✅ Suggested queries already provided                          │
│  ✅ Item type: "jacket" mentioned                               │
│                                                                 │
│  LLM Decision:                                                  │
│  "User mentioned specific brand + item type                     │
│   → Generate search queries immediately                         │
│   → Include original brand: KNWLS                               │
│   → Include vibe-alikes: Miss Sixty, Diesel                     │
│   → Add 'jacket' to all queries                                 │
│   → Start response with 'Searching Vinted and Depop for:'"     │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  LLM Output (Streamed)                                          │
│  ────────────────────────────────────────────────────────────  │
│  "Searching Vinted and Depop for: KNWLS jacket, Miss Sixty     │
│   jacket, Diesel jacket"                                        │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  Return Response to Frontend                                    │
│  ────────────────────────────────────────────────────────────  │
│  Status: 200 OK                                                 │
│  Content-Type: text/plain                                       │
│  Body: "Searching Vinted and Depop for: KNWLS jacket, Miss     │
│         Sixty jacket, Diesel jacket"                            │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│          FRONTEND: ChatSection Component                        │
│  (app/page.tsx:76-88)                                           │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 9: Parse Response for Search Trigger                     │
│  ────────────────────────────────────────────────────────────  │
│  onFinish: (message) => {                                       │
│      if (message.content.startsWith("Searching Vinted...")) {  │
│          // Extract queries                                     │
│          const queries = queryPart.split(',')                   │
│              .map(q => q.trim());                               │
│          // ["KNWLS jacket", "Miss Sixty jacket", "Diesel..."] │
│          fetchProducts(queries, filters);                       │
│      }                                                          │
│  }                                                              │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│     STEP 10: Fetch Products (useProductFetcher hook)           │
│  (app/components/hooks/useProductFetcher.ts)                   │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  POST /api/vinted/search-external                              │
│  ────────────────────────────────────────────────────────────  │
│  Body: {                                                        │
│      queries: [                                                 │
│          "KNWLS jacket",                                        │
│          "Miss Sixty jacket",                                   │
│          "Diesel jacket"                                        │
│      ],                                                         │
│      filters: { priceRange: {...}, sizes: [...] }              │
│  }                                                              │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 11: Search Vinted (Sequential)                           │
│  (app/api/vinted/search-external/route.ts:36-206)              │
│  ────────────────────────────────────────────────────────────  │
│  For each query:                                                │
│    1. searchVinted("KNWLS jacket")                             │
│       ➜ Found: 3 items (€450-650)                              │
│                                                                 │
│    2. searchVinted("Miss Sixty jacket")                        │
│       ➜ Found: 12 items (€25-55)                               │
│                                                                 │
│    3. searchVinted("Diesel jacket")                            │
│       ➜ Found: 8 items (€30-85)                                │
│                                                                 │
│  Total: 23 products                                             │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 12: Deduplicate & Filter                                 │
│  ────────────────────────────────────────────────────────────  │
│  Deduplication (by product ID):                                 │
│  23 products → 23 unique (no duplicates)                        │
│                                                                 │
│  Apply Filters:                                                 │
│  - Price range: [null, null] → No filtering                    │
│  - Sizes: [] → No filtering                                    │
│                                                                 │
│  Shuffle results for variety                                    │
│                                                                 │
│  Final: 23 products                                             │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  Return Products to Frontend                                    │
│  ────────────────────────────────────────────────────────────  │
│  {                                                              │
│      products: [                                                │
│          {                                                      │
│              id: "vinted_123",                                  │
│              title: "KNWLS Asymmetric Top",                     │
│              price: "€495",                                     │
│              brand: "KNWLS",                                    │
│              platform: "Vinted"                                 │
│          },                                                     │
│          {                                                      │
│              id: "vinted_456",                                  │
│              title: "Miss Sixty Y2K Jacket",                    │
│              price: "€35",                                      │
│              brand: "Miss Sixty",                               │
│              platform: "Vinted"                                 │
│          },                                                     │
│          {                                                      │
│              id: "vinted_789",                                  │
│              title: "Diesel Leather Moto Jacket",               │
│              price: "€68",                                      │
│              brand: "Diesel",                                   │
│              platform: "Vinted"                                 │
│          },                                                     │
│          // ... 20 more items                                   │
│      ]                                                          │
│  }                                                              │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 13: Display in Pinterest Grid                            │
│  (app/components/ProductResults.tsx)                            │
│  ────────────────────────────────────────────────────────────  │
│                                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                     │
│  │ KNWLS    │  │ Miss 60  │  │ Diesel   │                     │
│  │ Jacket   │  │ Y2K Jckt │  │ Moto Jkt │                     │
│  │ €495     │  │ €35      │  │ €68      │                     │
│  └──────────┘  └──────────┘  └──────────┘                     │
│                                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                     │
│  │ Miss 60  │  │ KNWLS    │  │ Diesel   │                     │
│  │ Top      │  │ Dress    │  │ Jeans    │                     │
│  │ €28      │  │ €550     │  │ €45      │                     │
│  └──────────┘  └──────────┘  └──────────┘                     │
│                                                                 │
│  ... 17 more items                                              │
│                                                                 │
│  USER SEES:                                                     │
│  - 3 KNWLS items (€450-650) - Aspiration                       │
│  - 12 Miss Sixty items (€25-55) - Affordable                   │
│  - 8 Diesel items (€30-85) - Affordable                        │
│                                                                 │
│  Perfect mix of style inspiration + budget options! ✨          │
└─────────────────────────────────────────────────────────────────┘
```

## Key Innovation Points

### 🎯 Point 1: Intelligent Brand Detection (Step 1-2)
- Not just keyword matching
- Database-backed brand recognition
- Category classification (Trendy vs Affordable)

### 🧬 Point 2: Vibe Matching Algorithm (Step 3)
- Jaccard similarity for accurate matching
- Shared aesthetic tags (y2k, moto_glam)
- Scored results (60%, 55%, 40%)

### 📝 Point 3: Pre-Generated Queries (Step 4)
- System suggests exact search terms
- LLM can use directly or adapt
- Reduces hallucination risk

### 🎨 Point 4: Rich Context Building (Step 5)
- Structured sections (=== headers ===)
- Visual markers (💡 📝 ⚡)
- Smart instructions based on query type

### 🤖 Point 5: Enhanced LLM Prompt (Step 7)
- Clear identity and mission
- Concrete examples
- Decision tree logic
- Quality checklist

### 🔍 Point 6: Automated Search Execution (Step 9-12)
- Frontend detects search trigger
- Executes multiple queries in parallel
- Deduplicates and filters
- Returns mixed results

## The Magic: Before vs After

### BEFORE (Generic LLM)
```
User: "Find me KNWLS jacket"
  ↓
LLM: [tries to remember KNWLS]
  ↓
Search: "KNWLS jacket"
  ↓
Results: 3 KNWLS items (all €500+)
  ↓
User: "Too expensive!" 😞
```

### AFTER (Brand Matching Integrated)
```
User: "Find me KNWLS jacket"
  ↓
System: Detects KNWLS → Finds vibe-alikes (Miss Sixty, Diesel)
  ↓
LLM: [sees exact brand matches in context]
  ↓
Search: "KNWLS jacket", "Miss Sixty jacket", "Diesel jacket"
  ↓
Results: 3 KNWLS (€500+) + 20 affordable alternatives (€25-85)
  ↓
User: "Perfect! I found something!" 🎉
```

---

**The Result:** Every expensive brand search automatically includes affordable alternatives with the same aesthetic vibe.

**The Impact:** Users discover budget-friendly options they didn't know existed, while still seeing the aspirational pieces they originally wanted.
