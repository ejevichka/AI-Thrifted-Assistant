# 🧪 TIER_BOOST Testing Guide

## ✅ Что уже сделано

1. ✅ **3 функции добавлены** в `app/api/vinted/search-external/route.ts` (строки 28-175)
   - `TIER_BOOST_MULTIPLIERS` configuration
   - `loadBrandMetadata()` function
   - `applyTierBoost()` function

2. ✅ **Вызов добавлен** на строке 495:
   ```typescript
   uniqueProducts = await applyTierBoost(uniqueProducts);
   ```

3. ✅ **Dev server запущен** на http://localhost:3000

## 🧪 Как протестировать

### Test 1: Через UI (Recommended)

1. Открой http://localhost:3000 в браузере

2. Кликни на любой style card (например "Y2K" или "Goth")

3. Открой Browser Console (F12 → Console tab)

4. **Ищи эти логи:**

```
📥 Loading brand metadata from Supabase...
✅ Loaded 934 brands with tier metadata in 150ms

🎯 Applying TIER_BOOST to 200 products...
🎯 TIER_BOOST complete:
   Duration: 8ms
   Distribution: {"icon":12,"gem":85,"mainstream":103}
   Top 5 brands: Rick Owens (icon), Cop Copine (gem), Baby Phat (gem), ...
```

5. **Проверь результаты** - icon/gem бренды должны быть в топе!

### Test 2: Через API (curl)

```bash
curl -X POST http://localhost:3000/api/vinted/search-external \
  -H "Content-Type: application/json" \
  -d '{
    "queries": ["Rick Owens", "Esprit", "Cop Copine"],
    "filters": {},
    "useAiRanker": false,
    "styleId": "goth"
  }'
```

**Expected response:**
- First items should be Rick Owens (icon) products
- Then Cop Copine (gem) products
- Esprit (mainstream) should be at the bottom

### Test 3: Проверка тестовыми брендами

**Создай файл `test-tier-boost.ts`:**

```typescript
const testBrands = [
  { name: "Rick Owens", expected: "icon", boost: 2.5 },
  { name: "Cop Copine", expected: "gem", boost: 1.5 },
  { name: "Esprit", expected: "mainstream", boost: 0.7 },
  { name: "COS", expected: "affordable", boost: 1.0 },
  { name: "Giuseppe Zanotti", expected: "luxury", boost: 2.0 }
];

// Запрос для каждого бренда
testBrands.forEach(brand => {
  console.log(`Testing ${brand.name} (expect tier=${brand.expected})`);
  // ... make API call and verify
});
```

## 🔍 Что проверять в Console Logs

### ✅ Success Indicators:

1. **Cache loaded:**
   ```
   ✅ Loaded 934 brands with tier metadata in 150ms
   ```

2. **TIER_BOOST applied:**
   ```
   🎯 TIER_BOOST complete:
      Duration: 8ms
      Distribution: {"icon":12,"gem":85,"mainstream":103}
   ```

3. **Top brands are icon/gem:**
   ```
   Top 5 brands: Rick Owens (icon), Ann Demeulemeester (icon), ...
   ```

4. **Tier distribution makes sense:**
   - ~60-70% gem brands
   - ~10-20% icon brands
   - ~20-30% mainstream brands

### ❌ Error Indicators:

1. **No metadata loaded:**
   ```
   ❌ Failed to load brand metadata: ...
   ```
   → Check Supabase connection and env vars

2. **All products tier=mainstream:**
   ```
   Distribution: {"mainstream":200}
   ```
   → Brand name normalization не работает

3. **Cache not working:**
   ```
   📥 Loading brand metadata from Supabase... (repeated many times)
   ```
   → Cache не сохраняется между запросами

## 📊 Expected Tier Distribution

**For Y2K search:**
```json
{
  "gem": 120,        // Baby Phat, Juicy Couture, Cop Copine
  "mainstream": 70,  // Esprit, ASOS, H&M
  "icon": 10         // Maybe some vintage Chanel, Dior
}
```

**For Goth search:**
```json
{
  "icon": 40,        // Rick Owens, Ann D, Julius
  "gem": 100,        // A-COLD-WALL, Barbara Gongini
  "mainstream": 60   // H&M, Zara black items
}
```

## 🐛 Troubleshooting

### Problem: "No console logs appear"

**Solution:** API endpoint не вызывается. Check:
```javascript
// В UI component, проверь что search запрос отправляется:
console.log('Fetching products with queries:', queries);
```

### Problem: "All brands show as mainstream"

**Solution:** Brand name normalization. Debug:
```typescript
// Add in applyTierBoost():
console.log('Product brand:', product.brand);
console.log('Normalized:', normalizeBrand(product.brand));
console.log('Found in cache:', brandMetadata.has(normalizeBrand(product.brand)));
```

### Problem: "Cache loads every time (slow)"

**Solution:** Module reload issue in dev mode. This is expected in `npm run dev`.
In production, cache will persist properly.

### Problem: "TypeScript errors"

**Solution:** Add type to ScrapedItem interface:
```typescript
interface ScrapedItem {
  // ... existing fields
  _metadata?: {
    tier: string;
    boost: number;
    diggyScore: number;
    originalPosition: number;
    avg_price?: string;
    context_tags?: string[];
  };
}
```

## 🎯 Success Criteria

**TIER_BOOST is working if:**

1. ✅ Console shows "✅ Loaded X brands" message
2. ✅ Console shows "🎯 TIER_BOOST complete" with distribution
3. ✅ Top 5-10 brands in results are icon/gem tier
4. ✅ Mainstream brands appear in bottom 50%
5. ✅ Search feels more "curated" (less mainstream clutter)

## 📈 Performance Benchmarks

**Expected timings:**

```
Component              | Time      | Acceptable Range
-----------------------|-----------|------------------
Cache load (first)     | ~100-200ms| < 500ms
Cache load (cached)    | ~0ms      | Instant
TIER_BOOST sort        | ~5-10ms   | < 50ms
Total overhead         | ~10ms     | < 100ms
```

**If TIER_BOOST takes > 100ms, check:**
- Supabase query performance (add indexes if needed)
- Number of products being sorted (should be ~200, not 2000+)

## 🚀 Next Steps After Testing

1. **If all tests pass:**
   - ✅ Deploy to production
   - ✅ Monitor tier distribution in logs
   - ✅ Collect user feedback

2. **Fine-tune boost multipliers:**
   ```typescript
   const TIER_BOOST_MULTIPLIERS = {
     icon: 3.0,    // Increase if icons not showing enough
     gem: 1.8,     // Increase to prioritize gems more
     mainstream: 0.5  // Decrease to hide mainstream more
   };
   ```

3. **Add tier badges in UI:**
   ```tsx
   {product._metadata?.tier === 'gem' && <Badge>💎 Hidden Gem</Badge>}
   {product._metadata?.tier === 'icon' && <Badge>👑 Icon</Badge>}
   ```

4. **Add tier filters:**
   ```tsx
   <Filter>
     <Option value="gems-only">💎 Gems Only</Option>
     <Option value="icons-only">👑 Icons Only</Option>
   </Filter>
   ```

## 🎉 You're Done!

**Your search engine now has a "curatorial taste"!**

Icon and gem brands are prioritized, mainstream brands are de-prioritized.

Check the browser console for tier distribution and enjoy the improved search quality! 🎯
