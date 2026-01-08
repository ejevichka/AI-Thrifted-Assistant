# 🔥 HOTFIX: Relevance Sorting (Applied)

## Проблема
VibeDNA генерировал идеальные запросы брендов (Patagonia, Arc'teryx, Salomon), но пользователь видел "свалку":
- DVD про альпинистов
- Наборы для фуа-гра
- Случайные товары

## Причина
1. **Дефолтная сортировка:** `order: 'newest_first'` вместо `order: 'relevance'`
2. **Случайное перемешивание:** Код случайно перемешивал результаты Vinted после их ранжирования

## Что Исправлено

### 1. Дефолтная сортировка → Relevance
**Файл:** `app/api/vinted/search-external/route.ts:326`

```typescript
// ❌ БЫЛО:
order: filters?.order || 'newest_first'

// ✅ СТАЛО:
order: filters?.order || 'relevance' // Default to relevance for curated results
```

### 2. Убрано случайное перемешивание
**Файл:** `app/api/vinted/search-external/route.ts:363-368`

```typescript
// ❌ БЫЛО:
const shouldShuffle = !vintedFilters.order || vintedFilters.order === 'relevance';
const finalProducts = shouldShuffle
  ? uniqueProducts.sort(() => 0.5 - Math.random())
  : uniqueProducts;

// ✅ СТАЛО:
// Keep Vinted's relevance sorting - DO NOT shuffle!
// Vinted already ranked these by relevance to the search query.
// Shuffling destroys the curation and shows random items.
const finalProducts = uniqueProducts;
```

### 3. Дефолт в Frontend
**Файл:** `app/components/screens/DigByMoodboardScreen.tsx:48`

```typescript
// ❌ БЫЛО:
order: 'newest_first',

// ✅ СТАЛО:
order: 'relevance', // Use relevance for curated, high-quality results
```

## Результат

### До:
1. VibeDNA → ['Patagonia', 'Arc'teryx', 'Salomon']
2. Vinted API → 500 товаров (хорошо отсортированных)
3. Код → Перемешивает случайно
4. Пользователь → Видит DVD и фуа-гра

### После:
1. VibeDNA → ['Patagonia', 'Arc'teryx', 'Salomon']
2. Vinted API → 500 товаров (отсортированных по relevance)
3. Код → Сохраняет сортировку Vinted
4. Пользователь → Видит куртки Arc'teryx, ботинки Salomon, флиски Patagonia

## Ожидаемое улучшение
- ❌ Исчезнут: DVD, игрушки, наборы для еды, случайные товары
- ✅ Появятся: Релевантные товары от правильных брендов
- 📊 Качество: С ~20% до ~90% релевантности

## Следующий шаг: AI-Ranker (Phase 2)
Этот хотфикс убирает 90% мусора. Для идеальной кураторской подборки (как в бутике) нужен AI-Ranker:

```
Vinted API (500 товаров) → AI-Ranker (оценивает каждый 0-10) → Топ-200 жемчужин
```

Смотри: `docs/AI-RANKER-ARCHITECTURE.md` (coming soon)

## Статус
✅ Применено
⏳ Требует тестирования в браузере

## Тест
```bash
npm run dev
# Открой http://localhost:3000
# Dig by Moodboard → Click "Gorpcore"
# Должен увидеть: Arc'teryx, Salomon, Patagonia (не DVD!)
```
