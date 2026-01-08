# 🔧 Magic Loader: ИСПРАВЛЕНИЕ SSE Stream

## Проблема (до исправления)

```
AI-Ranker (SSE stream)
    ↓
search-external (❌ "съедал" stream, логировал в консоль сервера)
    ↓
Frontend (❌ получал JSON после 20 секунд, БЕЗ прогресса)
    ↓
MagicLoader (❌ показывал ОДНО сообщение 20 секунд)
```

**Результат:** Пользователь видел "Окей... Ищем вайб..." 20 секунд подряд, без обновлений.

---

## Решение (после исправления)

```
AI-Ranker (SSE stream)
    ↓
search-external (✅ ПРОКСИРУЕТ stream дальше)
    ↓
Frontend (✅ читает stream в реальном времени с response.body.getReader())
    ↓
MagicLoader (✅ обновляется каждые ~2 секунды)
```

**Результат:** Пользователь видит прогресс в реальном времени:
- [0 сек] "Окей... Ищем 'gorpcore' вайб..."
- [2 сек] "VibeDNA нашел профиль: Gorpcore"
- [4 сек] "Получено 487 кандидатов от Vinted..."
- [6 сек] "Chunk 1/7... Отсеиваю DVD и фуа-гра..."
- [8 сек] "Chunk 2/7... Ищу настоящие гемы..."
- [20 сек] "Готово! Найдено 12 гемов и 34 отличных вещей."

---

## Что Изменилось

### 1. `search-external/route.ts` (Строки 367-394)

**До:**
```typescript
// ❌ Читал stream и ломал его
const reader = rankerResponse.body?.getReader();
while (true) {
  const { done, value } = await reader.read();
  // ... парсил и логировал ...
  console.log(`🤖 AI-Ranker: ${data.status}`);
}
// Возвращал JSON (БЕЗ прогресса)
return NextResponse.json({ products: finalProducts });
```

**После:**
```typescript
// ✅ Проксирует stream напрямую
if (contentType?.includes('text/event-stream')) {
  return new Response(rankerResponse.body, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
```

---

### 2. `useProductFetcher.ts` (Строки 43-137)

**До:**
```typescript
// ❌ Блокирующий await
setProgressMessage(`Окей... Ищем вайб...`); // Устанавливается ОДИН раз

const response = await fetch(...);
const data = await response.json(); // ❌ БЛОКИРУЕТСЯ здесь 20 секунд!

setProgressMessage(null); // Очищается ТОЛЬКО в конце
```

**После:**
```typescript
// ✅ Читает SSE stream в реальном времени
const contentType = response.headers.get('content-type');

if (contentType?.includes('text/event-stream')) {
  const reader = response.body?.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = JSON.parse(line.slice(6));

        // ✅ Обновляется В РЕАЛЬНОМ ВРЕМЕНИ!
        if (data.status) {
          setProgressMessage(data.status);
        }

        if (data.complete && data.result) {
          setProducts(data.result.rankedProducts);
          setProgressMessage(null);
        }
      }
    }
  }
}
```

---

## Как Протестировать

### Шаг 1: Включить AI-Ranker

**Файл:** `app/components/screens/DigByMoodboardScreen.tsx:122`

```typescript
// Изменить:
fetchProducts(brandQueries, vintedFilters, false, styleId);

// На:
fetchProducts(brandQueries, vintedFilters, true, styleId); // ✅ AI-Ranker включен
```

### Шаг 2: Запустить Dev Server

```bash
npm run dev
```

### Шаг 3: Открыть Browser Console

1. Открыть Chrome DevTools (F12)
2. Перейти на вкладку Console

### Шаг 4: Тестировать

1. Перейти в "Dig by Moodboard"
2. Кликнуть на карточку "Gorpcore" (или любой другой стиль)
3. **Ожидаемое поведение:**
   - Экран затемняется
   - Magic Loader появляется
   - Текст обновляется каждые ~2 секунды
   - В консоли видно:
     ```
     📡 Receiving SSE stream from AI-Ranker...
     🤖 Progress: Окей... Ищем 'gorpcore' вайб...
     🤖 Progress: VibeDNA нашел профиль: Gorpcore
     🤖 Progress: Получено 487 кандидатов от Vinted...
     🤖 Progress: Chunk 1/7... Отсеиваю DVD и фуа-гра...
     🤖 Progress: Chunk 2/7... Ищу настоящие гемы...
     ...
     ✅ AI-Ranker complete: 200 products
     ✅ SSE stream completed
     ```

---

## Технические Детали

### SSE (Server-Sent Events)

**Формат:**
```
data: {"status": "Chunk 1/7... Отсеиваю DVD и фуа-гра..."}

data: {"status": "Chunk 2/7... Ищу настоящие гемы..."}

data: {"complete": true, "result": {...}}

```

**Почему \n\n?**
- SSE использует пустую строку (`\n\n`) как разделитель между сообщениями
- Frontend читает до `\n\n`, парсит, обновляет UI, потом читает дальше

### Buffer Management

```typescript
let buffer = '';

while (true) {
  buffer += decoder.decode(value, { stream: true });
  const lines = buffer.split('\n\n');

  // ✅ Сохраняем последнюю (неполную) строку обратно в буфер
  buffer = lines.pop() || '';

  // Обрабатываем только полные сообщения
  for (const line of lines) {
    // ...
  }
}
```

**Зачем?** Chunk от `reader.read()` может содержать:
- Несколько полных сообщений: `data: {...}\n\ndata: {...}\n\n`
- Половину сообщения: `data: {"status": "Chu`

Buffer обеспечивает, что мы всегда парсим только **полные** сообщения.

---

## Итог

✅ **search-external теперь проксирует SSE stream**
✅ **useProductFetcher читает stream в реальном времени**
✅ **MagicLoader обновляется каждые ~2 секунды**
✅ **Пользователь видит прогресс вместо тишины**

Проблема "20 секунд смерти" решена! 🎉
