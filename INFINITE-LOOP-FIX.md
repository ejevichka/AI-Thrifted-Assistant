# 🔥 Infinite Loop Fix

## Problem
App went into infinite loop when running `npm run dev`:
```
Starting ingestion process for styles...
Total documents to vectorize: 20
Ingestion process completed.
Starting ingestion process for styles...
Total documents to vectorize: 20
Ingestion process completed.
...
```

## Root Cause
**File:** `app/page.tsx:161-179`

```typescript
useEffect(() => {
  const checkStatus = async () => {
    const response = await fetch('/api/vinted/ingest-status');
    const data = await response.json();
    if (!data.isIngested) {
      setIngestionNeeded(true); // ❌ Triggers ingestion
    }
  };
  checkStatus();
}, []);
```

**What happened:**
1. Page loads → `useEffect` checks `/api/vinted/ingest-status`
2. Status endpoint checks `vinted_documents` table
3. Table is empty (or gets cleared) → returns `isIngested: false`
4. App triggers `/api/vinted/ingest` POST
5. Ingest endpoint **deletes all data** (line 39) then re-ingests
6. App reloads/re-renders → go to step 1 (infinite loop)

## Solution

**File:** `app/page.tsx:161-179`

**Changed:**
```typescript
useEffect(() => {
  const checkStatus = async () => {
    try {
      // ✅ DISABLED auto-ingestion
      // const response = await fetch('/api/vinted/ingest-status');
      // const data = await response.json();
      // if (!data.isIngested) {
      //   setIngestionNeeded(true);
      // }
      console.log('Auto-ingestion disabled. VibeDNA is used instead.');
    } catch (error) {
      console.error("Failed to check ingestion status:", error);
    }
  };
  checkStatus();
}, []);
```

**Why this works:**
- Old system (`vinted_documents` + OpenAI embeddings) is **not used** anymore
- New system (VibeDNA) uses `vibe_entities` table with pre-computed vectors
- No need for automatic ingestion on every page load

## Status
✅ **Fixed** - Auto-ingestion disabled
✅ **VibeDNA active** - Uses `vibe_entities` table (934 brands ready)
✅ **No more loops** - Page loads normally

## How to Test
```bash
npm run dev
# Should start without infinite ingestion loops
# Should see: "Auto-ingestion disabled. VibeDNA is used instead." in console
```

## Manual Ingestion (If Needed)
If you ever need to manually trigger old-style ingestion:
```bash
curl -X POST http://localhost:3000/api/vinted/ingest
```

But **not recommended** - VibeDNA is better in every way.
