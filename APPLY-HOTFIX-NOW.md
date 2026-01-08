# 🔧 APPLY HOTFIX (30 seconds)

## What This Fixes
The brand similarity search has a SQL bug: "column reference 'entity_name' is ambiguous"

This prevents Mode 3 (brand similarity) from working. Modes 1 & 2 work perfectly!

## Steps

**1. Supabase SQL Editor is open in your browser**
   - URL: https://supabase.com/dashboard/project/ymkigxqxwdwupcfcdfen/sql/new

**2. SQL is in clipboard**
   - Just press Cmd+V to paste

**3. Click "Run" button**
   - Or press Cmd+Enter

**4. Verify**
   - Should see: "Success. No rows returned"

## Test After Applying

```bash
curl -X POST http://localhost:3000/api/diggy/search-by-vibe \
  -H "Content-Type: application/json" \
  -d '{"brand_name": "Rick Owens", "limit": 5}'
```

Expected:
```json
{
  "results": [
    {
      "entity_name": "Ann Demeulemeester",
      "similarity": 0.95,
      "shared_styles": ["goth", "avantgarde", "deconstructed"]
    },
    ...
  ]
}
```

## What Was Fixed

The SQL function had:
```sql
SELECT
  s.entity_name,  -- ❌ Ambiguous - which entity_name?
```

Fixed to:
```sql
SELECT
  s.brand_name_result,  -- ✅ Clear alias
```

## File Location
`supabase/migrations/20250112000000_fix_brand_similarity.sql`

---

After this, all 3 search modes will work:
- ✅ Mode 1: Single style search (working)
- ✅ Mode 2: Multi-style weighted search (working)
- ⏳ Mode 3: Brand similarity search (needs this hotfix)
