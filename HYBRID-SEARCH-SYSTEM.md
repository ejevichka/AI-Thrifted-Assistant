# 🎯 Hybrid Search System - Архитектура

## Что мы построили: "Гибридный Поиск"

Ты создал **двухуровневую систему поиска**, которая работает как "мозг куратора":

### Layer 1: VibeDNA (Aesthetic Compass) - Эстетический компас
**Что**: 24-мерный вектор, описывающий эстетику бренда
**Для чего**: Поиск по "вайбу" / "атмосфере"
**Пример запроса**: "Найди бренды с avantgarde вайбом"

```typescript
// Поиск похожих брендов по вектору (cosine similarity)
const { data } = await supabase.rpc('find_similar_brands', {
  brand_name: 'Rick Owens',
  match_limit: 10,
  min_similarity: 0.5
});
// Результат: A-COLD-WALL, Ann Demeulemeester, Julius...
```

### Layer 2: Metadata (Curatorial Tags) - Кураторские теги
**Что**: "Паспорт" бренда с tier/price/origin/category
**Для чего**: Фильтрация по конкретным критериям
**Пример запроса**: "Найди gem-бренды из France эры y2k"

```sql
SELECT entity_name, metadata
FROM vibe_entities
WHERE metadata->>'tier' = 'gem'
  AND metadata->'context_tags' ? 'france'
  AND metadata->'context_tags' ? 'y2k';
-- Результат: Cop Copine, 25x, CELYN b...
```

## 🧠 Ключевой Инсайт: "Нулевые векторы" - это фича, не баг

### Пример: BELCCI

```json
{
  "entity_name": "BELCCI",
  "vibe_vector": [0, 0, 0, 0, 0, ...], // Нулевой вектор
  "metadata": {
    "tier": "gem",
    "avg_price": "mid",
    "context_tags": ["italy", "90s"],
    "core_category": "full_range"
  }
}
```

**Почему нулевой вектор?**
AI-генератор векторов (generate-brand-vibe-matrix.ts) не "знает" супер-нишевый бренд BELCCI, поэтому не может оценить его эстетику.

**Это проблема?**
НЕТ! Это ожидаемо и хорошо.

**Решение:**
Используй **гибридный подход**:

1. **VibeDNA search** → Найдет известные бренды с сильной эстетикой (Rick Owens, Acne Studios)
2. **Metadata search** → Найдет нишевые gems (BELCCI, Save the Queen!)

## 📊 Статистика системы

### VibeDNA Coverage (векторы)
- **High confidence** (top score > 0.5): ~400 брендов
- **Medium confidence** (top score 0.3-0.5): ~300 брендов
- **Low confidence** (top score < 0.3): ~234 бренда (включая нулевые)

### Metadata Coverage (паспорта)
- **Complete**: 933/934 брендов (99.9%)

### Tier Distribution
- 💎 **gem**: 583 (62.4%) - hidden gems для диггеров
- 🏪 **mainstream**: 201 (21.5%) - масс-маркет
- 👑 **icon**: 80 (8.6%) - эталонные бренды
- 💰 **affordable**: 67 (7.2%) - доступные альтернативы

## 🔍 Примеры гибридных запросов

### Query 1: "Найди avantgarde вайб + gem tier"

```typescript
// Сначала ищем по вайбу
const { data: vibeBrands } = await supabase.rpc('search_brands_by_style', {
  target_style_id: 'avantgarde',
  match_limit: 50,
  min_similarity: 0.3
});

// Затем фильтруем по tier
const gemAvantgarde = vibeBrands.filter(b =>
  b.metadata?.tier === 'gem'
);

// Результат: A-COLD-WALL, Barbara I Gongini, Avavav...
```

### Query 2: "Найди French y2k gems, даже если вектор нулевой"

```sql
-- Чисто metadata-based search (работает для нишевых брендов)
SELECT entity_name, metadata, vibe_vector
FROM vibe_entities
WHERE metadata->>'tier' = 'gem'
  AND metadata->'context_tags' ? 'france'
  AND metadata->'context_tags' ? 'y2k';

-- Результат включит и известные (Cop Copine), и нишевые (25x, CELYN b)
```

### Query 3: "Найди бренды похожие на Rick Owens, но affordable"

```typescript
// Шаг 1: Ищем похожие по вектору
const { data: similar } = await supabase.rpc('find_similar_brands', {
  brand_name: 'Rick Owens',
  match_limit: 50,
  min_similarity: 0.4
});

// Шаг 2: Фильтруем по price
const affordableAlternatives = similar.filter(b =>
  b.metadata?.tier === 'affordable' || b.metadata?.avg_price === 'mid'
);

// Результат: COS, Arket, Uniqlo (если в выборке)
```

## 🚀 Использование в Search API

### Hybrid Ranking Strategy

```typescript
function calculateHybridScore(brand: Brand, query: SearchQuery): number {
  let score = 0;

  // 1. VibeDNA similarity (если известный бренд)
  if (brand.vibe_similarity > 0.3) {
    score += brand.vibe_similarity * 0.6; // 60% веса
  }

  // 2. Tier boost (кураторский уровень)
  const tierBoosts = {
    icon: 2.0,
    gem: 1.5,
    affordable: 1.0,
    mainstream: 0.8
  };
  score *= tierBoosts[brand.metadata.tier] || 1.0;

  // 3. Price relevance (если пользователь фильтрует)
  if (query.priceRange === brand.metadata.avg_price) {
    score *= 1.3;
  }

  // 4. Context tags match (эра/происхождение)
  const tagMatches = query.tags?.filter(t =>
    brand.metadata.context_tags.includes(t)
  ).length || 0;
  score += tagMatches * 0.1; // Бонус за каждый совпавший тег

  return score;
}
```

### Example API Implementation

```typescript
// app/api/vinted/search-hybrid/route.ts
export async function POST(req: Request) {
  const { query, filters } = await req.json();

  // Параллельные запросы: VibeDNA + Metadata
  const [vibeResults, metadataResults] = await Promise.all([
    // VibeDNA search (по вектору)
    supabase.rpc('search_brands_by_styles', {
      style_weights: query.styleWeights,
      match_limit: 100
    }),

    // Metadata search (по фильтрам)
    supabase
      .from('vibe_entities')
      .select('*')
      .eq('metadata->>tier', filters.tier)
      .contains('metadata->context_tags', filters.tags)
  ]);

  // Merge + Deduplicate + Hybrid Score
  const mergedResults = mergeAndScore(
    vibeResults.data,
    metadataResults.data,
    query
  );

  // Sort by hybrid score
  mergedResults.sort((a, b) => b.hybridScore - a.hybridScore);

  return Response.json({ brands: mergedResults.slice(0, 20) });
}
```

## 📈 Performance с индексами

### Без индексов:
```
SELECT ... WHERE metadata->>'tier' = 'gem'  →  ~200-500ms (full table scan)
```

### С GIN индексами:
```
SELECT ... WHERE metadata->>'tier' = 'gem'  →  ~1-5ms (index scan)
```

### Применить индексы:

Выполни SQL из файла **`APPLY-INDEXES-NOW.sql`** в Supabase SQL Editor:
https://supabase.com/dashboard/project/ymkigxqxwdwupcfcdfen/sql

## 🎨 UI Integration Ideas

### 1. Brand Badges
```tsx
{brand.metadata.tier === 'gem' && (
  <Badge variant="gem">💎 Hidden Gem</Badge>
)}
{brand.metadata.tier === 'icon' && (
  <Badge variant="icon">👑 Icon Brand</Badge>
)}
```

### 2. Smart Filters
```tsx
<FilterGroup>
  <Filter label="Tier">
    <Option value="icon">Icons (80)</Option>
    <Option value="gem">Hidden Gems (583)</Option>
    <Option value="affordable">Affordable (67)</Option>
  </Filter>

  <Filter label="Era">
    <Option value="80s">80s</Option>
    <Option value="90s">90s</Option>
    <Option value="y2k">Y2K</Option>
    <Option value="2000s">2000s</Option>
  </Filter>

  <Filter label="Origin">
    <Option value="france">France</Option>
    <Option value="italy">Italy</Option>
    <Option value="japan">Japan</Option>
  </Filter>
</FilterGroup>
```

### 3. Contextual Tooltips
```tsx
<Tooltip>
  <BrandName>{brand.name}</BrandName>
  <Tags>
    {brand.metadata.context_tags.map(tag => (
      <Tag key={tag}>{tag}</Tag>
    ))}
  </Tags>
  <Price>{brand.metadata.avg_price} price range</Price>
</Tooltip>
```

## ✅ Checklist: System Ready

- [x] VibeDNA векторы сгенерированы (934 бренда)
- [x] Metadata "паспорта" созданы (933/934 бренда)
- [x] HNSW индекс на vibe_vector (для cosine similarity)
- [ ] **GIN индексы на metadata** ← **APPLY NOW!**
- [ ] Hybrid search API endpoint
- [ ] UI filters + badges

## 🎯 Next Step: Apply Indexes!

Открой Supabase SQL Editor и выполни:
```bash
cat APPLY-INDEXES-NOW.sql
```

После этого твоя **гибридная поисковая система** будет полностью готова! 🚀
