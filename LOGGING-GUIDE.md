# 📊 Logging Guide: VibeDNA & AI-Ranker

## Обзор

Добавлено подробное логирование для отслеживания всего процесса от VibeDNA vector search до AI-Ranker scoring.

---

## 1. VibeDNA Vector Search Logs

**Файл:** `app/hooks/useVibeDNASearch.ts`

### Когда запускается поиск по стилю

```javascript
console.log(`🧬 VibeDNA: Searching for style "gorpcore"`, {
  limit: 10,
  minSimilarity: 0.3
});
```

### Когда получены результаты

```javascript
console.log(`✅ VibeDNA: Found 10 brands for "gorpcore":`);
console.table([
  { brand: "Arc'teryx", similarity: "0.892", sharedStyles: "gorpcore, techwear" },
  { brand: "Salomon", similarity: "0.856", sharedStyles: "gorpcore" },
  { brand: "Patagonia", similarity: "0.821", sharedStyles: "gorpcore, cottagecore" },
  // ...
]);
```

**Что показывает:**
- Название бренда
- Similarity score (0-1)
- Общие стили между брендом и поиском

### Ошибки

```javascript
console.error('❌ VibeDNA search error:', error);
```

---

## 2. AI-Ranker Logs (Streaming Mode)

**Файл:** `app/api/diggy/rank-products/route.ts`

### Начало ranking

```javascript
console.log(`🎯 AI-Ranker (Streaming): Starting for style "gorpcore" with 487 products`);
```

### Загрузка Vibe Profile

```javascript
console.log(`✅ Vibe profile loaded:`, {
  name: "Gorpcore",
  componentsCount: 12,
  brandsCount: 25,
  keywordsCount: 8
});
```

### Progress updates (через SSE)

```javascript
console.log(`📡 Streaming progress: Окей... Ищем 'gorpcore' вайб...`);
console.log(`📡 Streaming progress: VibeDNA нашел профиль: Gorpcore`);
console.log(`📡 Streaming progress: Получено 487 кандидатов от Vinted...`);
console.log(`📡 Streaming progress: Chunk 1/7... Отсеиваю DVD и фуа-гра...`);
```

---

## 3. Claude API Logs

**Файл:** `app/api/diggy/rank-products/route.ts` (функция `scoreProductsWithClaude`)

### Отправка запроса

```javascript
console.log(`🤖 Claude API: Sending 80 products for scoring...`);
```

### Получение ответа

```javascript
console.log(`⏱️  Claude API: Response received in 2341ms`);
console.log(`📊 Claude API: Response length: 1243 characters`);
```

### Парсинг scores

```javascript
console.log(`✅ Claude returned scores for 80 products`);
```

### Score distribution

```javascript
console.log(`📈 Score distribution: 10 (gems)=5, 7-9 (great)=23, 3-6 (medium)=38, 0-2 (trash)=14`);
console.log(`📊 Average score: 5.67`);
```

**Что показывает:**
- **10 (gems)**: Идеальные товары (Arc'teryx Beta, Salomon trail shoes)
- **7-9 (great)**: Очень хорошие товары (Patagonia fleece)
- **3-6 (medium)**: Средние товары (generic hiking pants)
- **0-2 (trash)**: Мусор (DVDs, foie gras sets)

### Ошибки Claude API

```javascript
console.error('❌ Claude API error:', error.message);
console.error('Full error:', error);
console.warn(`⚠️  Using fallback scores (all 5) for 80 products`);
```

---

## 4. Финальные Результаты

### После scoring всех chunks

```javascript
console.log(`✅ AI-Ranker (Streaming): Complete in 18234ms`);
console.log(`📊 Final stats:`, {
  totalProducts: 487,
  gems: 12,
  great: 67,
  medium: 203,
  trash: 205,
  avgScore: "4.23"
});
```

### Закрытие stream

```javascript
console.log(`🏁 AI-Ranker (Streaming): Stream closed`);
```

---

## Пример Полного Лога (Gorpcore Search)

```
🧬 VibeDNA: Searching for style "gorpcore" Object { limit: 10, minSimilarity: 0.3 }
✅ VibeDNA: Found 10 brands for "gorpcore":
┌─────────┬──────────────┬────────────┬──────────────────────┐
│ (index) │ brand        │ similarity │ sharedStyles         │
├─────────┼──────────────┼────────────┼──────────────────────┤
│ 0       │ "Arc'teryx"  │ "0.892"    │ "gorpcore, techwear" │
│ 1       │ "Salomon"    │ "0.856"    │ "gorpcore"           │
│ 2       │ "Patagonia"  │ "0.821"    │ "gorpcore"           │
└─────────┴──────────────┴────────────┴──────────────────────┘

🎯 AI-Ranker (Streaming): Starting for style "gorpcore" with 487 products
✅ Vibe profile loaded: Object { name: "Gorpcore", componentsCount: 12, brandsCount: 25, keywordsCount: 8 }

📡 Streaming progress: Окей... Ищем 'gorpcore' вайб...
📡 Streaming progress: VibeDNA нашел профиль: Gorpcore
📡 Streaming progress: Получено 487 кандидатов от Vinted...
📡 Streaming progress: Это много. Начинаю AI-ранжирование (7 батчей)...

📡 Streaming progress: Chunk 1/7... Отсеиваю DVD и фуа-гра...
🤖 Claude API: Sending 80 products for scoring...
⏱️  Claude API: Response received in 2341ms
📊 Claude API: Response length: 1243 characters
✅ Claude returned scores for 80 products
📈 Score distribution: 10 (gems)=5, 7-9 (great)=23, 3-6 (medium)=38, 0-2 (trash)=14
📊 Average score: 5.67

📡 Streaming progress: Chunk 2/7... Ищу настоящие гемы...
🤖 Claude API: Sending 80 products for scoring...
⏱️  Claude API: Response received in 2198ms
📊 Claude API: Response length: 1189 characters
✅ Claude returned scores for 80 products
📈 Score distribution: 10 (gems)=2, 7-9 (great)=15, 3-6 (medium)=41, 0-2 (trash)=22
📊 Average score: 4.89

... (chunks 3-7) ...

📡 Streaming progress: AI-ранжирование завершено. Сортирую результаты...
✅ AI-Ranker (Streaming): Complete in 18234ms
📊 Final stats: Object {
  totalProducts: 487,
  gems: 12,
  great: 67,
  medium: 203,
  trash: 205,
  avgScore: "4.23"
}

📡 Streaming progress: Готово! Найдено 12 гемов и 67 отличных вещей.
🏁 AI-Ranker (Streaming): Stream closed
```

---

## Что Искать в Логах

### ✅ Успешный Search

1. **VibeDNA находит бренды:**
   ```
   ✅ VibeDNA: Found 10 brands for "gorpcore"
   ```

2. **AI-Ranker запускается:**
   ```
   🎯 AI-Ranker (Streaming): Starting for style "gorpcore" with 487 products
   ```

3. **Claude API отвечает быстро:**
   ```
   ⏱️  Claude API: Response received in 2341ms  // < 3 seconds = good
   ```

4. **Находятся гемы:**
   ```
   📈 Score distribution: 10 (gems)=12, 7-9 (great)=67
   ```

### ❌ Проблемы

#### 1. VibeDNA не находит бренды

```
❌ VibeDNA search error: Search failed: 404
```

**Причина:** Стиль не найден в `vibe_entities` таблице.

**Решение:** Проверить, что стиль был проинджестирован (934 brands expected).

#### 2. Claude API медленный

```
⏱️  Claude API: Response received in 8742ms  // > 5 seconds = slow
```

**Причина:** Rate limiting или большой chunk.

**Решение:** Уменьшить `CHUNK_SIZE` (сейчас 80).

#### 3. Claude API ошибка

```
❌ Claude API error: rate_limit_exceeded
⚠️  Using fallback scores (all 5) for 80 products
```

**Причина:** Превышен rate limit Anthropic API.

**Решение:** Увеличить задержку между chunks (сейчас 500ms).

#### 4. Все товары trash

```
📈 Score distribution: 10 (gems)=0, 7-9 (great)=2, 3-6 (medium)=18, 0-2 (trash)=60
📊 Average score: 2.13
```

**Причина:** Vinted вернул нерелевантные товары.

**Решение:**
- Проверить VibeDNA brands (они правильные?)
- Проверить Vinted filters (категории включены?)

---

## Как Использовать Логи для Debugging

### Сценарий 1: "Не находит хорошие товары"

1. **Проверь VibeDNA:**
   ```
   ✅ VibeDNA: Found 10 brands for "gorpcore"
   ```
   - Если brands неправильные → проблема в vector search
   - Если brands правильные → проблема в AI-Ranker

2. **Проверь Score Distribution:**
   ```
   📈 Score distribution: 10 (gems)=0, 7-9 (great)=2
   ```
   - Если gems=0 → Claude не видит хорошие товары
   - Возможно, Vinted вернул мусор

3. **Проверь Vinted результаты вручную:**
   - Открой `search-external` endpoint logs
   - Посмотри, что пришло от Vinted API

### Сценарий 2: "Слишком медленно"

1. **Проверь Claude API latency:**
   ```
   ⏱️  Claude API: Response received in 2341ms
   ```
   - Если > 5s → проблема с API
   - Если < 3s → проблема не в Claude

2. **Проверь количество chunks:**
   ```
   📦 Split 487 products into 7 chunks
   ```
   - Если > 10 chunks → слишком много товаров
   - Уменьши `per_page` в Vinted API

3. **Проверь общее время:**
   ```
   ✅ AI-Ranker (Streaming): Complete in 18234ms
   ```
   - 7 chunks × 2.5s = ~17.5s (ожидаемое)
   - Если > 30s → что-то не так

---

## Измерение Performance

### Ожидаемые Метрики

| Метрика | Ожидаемое | Плохо если > |
|---------|-----------|--------------|
| VibeDNA search | < 500ms | 2s |
| Claude API (1 chunk) | 1.5-3s | 5s |
| Total AI-Ranker (500 products) | 13-20s | 30s |
| Gems found (%) | 2-5% | 0% |
| Trash (%) | 30-50% | 80% |

### Формулы

**Total AI-Ranker Time:**
```
Total = (chunks × avgClaudeLatency) + (chunks × 500ms delay)
      = (7 × 2.5s) + (7 × 0.5s)
      = 17.5s + 3.5s
      = 21s
```

**Quality Score:**
```
Quality = (gems × 10 + great × 5) / totalProducts
        = (12 × 10 + 67 × 5) / 487
        = (120 + 335) / 487
        = 0.93 (хорошо!)
```

---

## Итог

✅ **VibeDNA logging** — видно какие бренды найдены и их similarity
✅ **AI-Ranker streaming logs** — видно прогресс каждого chunk
✅ **Claude API metrics** — latency, response size, score distribution
✅ **Final stats** — gems/great/medium/trash breakdown

Теперь можно полностью отследить весь процесс от VibeDNA поиска до финального ranking! 🎉
