# Brand Metadata System - Complete Guide

## 🎯 Что было сделано

### 1. Создана система AI-генерации метаданных для брендов

Используя ваш промпт "Diggy" (элитный фешн-куратор), система автоматически генерирует "паспорта" для каждого бренда из вашей коллекции.

### 2. Скрипты

#### ✅ `scripts/backfill-metadata.ts`
Основной скрипт для обогащения всех брендов метаданными.

#### ✅ `scripts/backfill-metadata-test.ts`
Тестовая версия (обрабатывает только 5 брендов).

#### ✅ `scripts/check-backfill-status.ts`
Проверка прогресса и статистики.

```bash
# Проверить текущий прогресс
npx tsx scripts/check-backfill-status.ts
```

### 3. База данных

#### Структура метаданных
Каждый бренд в таблице `vibe_entities` получает JSONB поле `metadata`:

```typescript
interface BrandMetadata {
  tier: 'icon' | 'gem' | 'affordable' | 'mainstream';
  avg_price: 'low' | 'mid' | 'high' | 'luxury';
  context_tags: string[]; // ['france', 'y2k', '90s']
  core_category: 'footwear' | 'outerwear' | 'denim' | 'knitwear' | 'accessories' | 'full_range';
}
```

#### Индексы (создать после завершения backfill)
См. файл `APPLY-INDEXES.md` для инструкций.

## 📊 Текущий статус

**Запущено:** Полный backfill работает в фоновом режиме

**Прогресс:** ~23.8% (222/934 брендов)

**Проверить статус:**
```bash
npx tsx scripts/check-backfill-status.ts
```

**Проверить процесс:**
```bash
ps aux | grep backfill-metadata
```

## 🔧 Использование метаданных

### SQL запросы

```sql
-- Найти все "gem" бренды
SELECT entity_name, metadata
FROM vibe_entities
WHERE metadata->>'tier' = 'gem';

-- Найти французские gem-бренды
SELECT entity_name, metadata
FROM vibe_entities
WHERE metadata->>'tier' = 'gem'
  AND metadata->'context_tags' ? 'france';

-- Найти icon-tier футвер
SELECT entity_name, metadata
FROM vibe_entities
WHERE metadata @> '{"tier": "icon", "core_category": "footwear"}';

-- Статистика по tiers
SELECT
  metadata->>'tier' as tier,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 1) as percentage
FROM vibe_entities
WHERE metadata->>'tier' IS NOT NULL
GROUP BY metadata->>'tier'
ORDER BY count DESC;
```

### В API

```typescript
// Фильтр по tier
const { data: gemBrands } = await supabase
  .from('vibe_entities')
  .select('entity_name, metadata, vibe_vector')
  .eq('entity_type', 'brand')
  .filter('metadata->>tier', 'eq', 'gem');

// Фильтр по тегам
const { data: frenchBrands } = await supabase
  .from('vibe_entities')
  .select('*')
  .contains('metadata->context_tags', ['france']);

// Комбинированный фильтр
const { data: affordableFrench } = await supabase
  .from('vibe_entities')
  .select('*')
  .filter('metadata->>tier', 'eq', 'affordable')
  .contains('metadata->context_tags', ['france']);
```

## 🎨 Интеграция в UI

### Идеи для использования метаданных

1. **Бейджи брендов**
   - 💎 "Hidden Gem" для tier=gem
   - 👑 "Icon Brand" для tier=icon
   - 💰 "Affordable Find" для tier=affordable

2. **Фильтры поиска**
   - Фильтр по tier
   - Фильтр по ценовому сегменту
   - Фильтр по эре (80s, 90s, y2k, 2000s)
   - Фильтр по происхождению (france, italy, japan, usa)

3. **Ранжирование результатов**
   - Повышать в выдаче gem/icon бренды
   - Учитывать price segment при сортировке

4. **Подсказки и обучение**
   - Показывать origin/era теги
   - Давать контекст о специализации (core_category)

## 📈 Статистика (текущая, ~24% обработано)

```
🏆 Tier Distribution:
   gem: 63.5%        (скрытые жемчужины)
   mainstream: 19.4% (масс-маркет)
   icon: 9.0%        (эталонные бренды)
   affordable: 8.1%  (доступные альтернативы)

💰 Price Distribution:
   mid: 78.4%    ($30-100)
   high: 11.3%   ($100-400)
   low: 5.9%     (до $30)
   luxury: 4.5%  ($400+)
```

## 🚀 Следующие шаги

### 1. Дождаться завершения backfill
Процесс займет ~6-8 часов. Проверяйте статус:
```bash
npx tsx scripts/check-backfill-status.ts
```

### 2. Применить индексы
После 100% completion, см. `APPLY-INDEXES.md`

### 3. Обновить API
Добавить metadata в:
- `/api/vinted/search-external` - фильтрация по tier/price
- `/api/diggy/*` - ранжирование с учетом tier

### 4. Обновить UI
- Добавить бейджи брендов
- Добавить фильтры по metadata
- Показывать origin/era теги

## 📝 Примеры результатов

```json
{
  "Rick Owens": {
    "tier": "icon",
    "avg_price": "high",
    "context_tags": ["usa", "90s", "2000s"],
    "core_category": "full_range"
  },
  "Cop Copine": {
    "tier": "gem",
    "avg_price": "mid",
    "context_tags": ["france", "y2k", "90s"],
    "core_category": "full_range"
  },
  "Arc'teryx": {
    "tier": "icon",
    "avg_price": "high",
    "context_tags": ["canada", "2000s"],
    "core_category": "outerwear"
  },
  "Acne Studios": {
    "tier": "icon",
    "avg_price": "high",
    "context_tags": ["sweden", "2000s"],
    "core_category": "full_range"
  }
}
```

## 🔍 Мониторинг

### Проверить процесс
```bash
ps aux | grep backfill-metadata
```

### Остановить процесс (если нужно)
```bash
pkill -f backfill-metadata
```

### Перезапустить
```bash
npx tsx scripts/backfill-metadata.ts > backfill.log 2>&1 &
```

### Посмотреть последние обработанные бренды
```sql
SELECT entity_name, metadata, updated_at
FROM vibe_entities
WHERE metadata->>'tier' IS NOT NULL
ORDER BY updated_at DESC
LIMIT 10;
```

## 💡 Troubleshooting

### Backfill остановился
```bash
# Проверить процесс
ps aux | grep backfill

# Перезапустить
npx tsx scripts/backfill-metadata.ts
```

### Проверить ошибки
Скрипт автоматически retry неудачных брендов 1 раз. В конце будет отчет о failed brands (если есть).

### Rate limiting от OpenAI
Скрипт использует delay 1-1.5s между запросами. Если получаете rate limit ошибки, увеличьте delay в `backfill-metadata.ts`.
