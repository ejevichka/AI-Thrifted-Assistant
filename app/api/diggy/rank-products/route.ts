import { NextRequest, NextResponse } from 'next/server';
import { ChatOpenAI } from '@langchain/openai';
import stylesData from '@/data/vinted/styles-enhanced.json';

const openai = new ChatOpenAI({
  modelName: 'gpt-4o-mini',
  temperature: 0.2,
  maxTokens: 4096,
});

interface Product {
  id: string;
  title: string;
  brand: string;
  price: string;
  description?: string;
  condition?: string;
}

interface RankedProduct extends Product {
  aiScore: number;
  aiReason?: string;
}

interface StyleProfile {
  id: string;
  name: string;
  description: string;
  tier2_components: string[];
  tier3_bolo_brands: string[];
  tier4_grail_keywords: string[];
  digger_note: string;
}

/**
 * AI-Ranker: Curates products using LLM scoring
 *
 * Flow:
 * 1. Receives 500 candidate products from Vinted
 * 2. Extracts "Vibe Profile" from styles-enhanced.json
 * 3. Sends products to Claude for batch scoring (0-10)
 * 4. Returns top-ranked "gems" sorted by AI score
 *
 * Supports streaming progress updates for Magic Loader UI
 */
export async function POST(req: NextRequest) {
  try {
    const { products, styleId, streamProgress } = await req.json();

    if (!products || !Array.isArray(products) || products.length === 0) {
      return NextResponse.json({ error: 'Products array is required' }, { status: 400 });
    }

    if (!styleId) {
      return NextResponse.json({ error: 'Style ID is required' }, { status: 400 });
    }

    // If streaming is requested, use SSE
    if (streamProgress) {
      return handleStreamingRanking(products, styleId);
    }

    // Otherwise, use standard JSON response
    return handleStandardRanking(products, styleId);
  } catch (error: any) {
    console.error('❌ AI-Ranker error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to rank products' },
      { status: 500 }
    );
  }
}

/**
 * Standard ranking (JSON response)
 */
async function handleStandardRanking(products: Product[], styleId: string) {
  console.log(`🎯 AI-Ranker: Scoring ${products.length} products for style: ${styleId}`);

  // Step 1: Extract Vibe Profile
  const vibeProfile = getVibeProfile(styleId);
  if (!vibeProfile) {
    return NextResponse.json(
      { error: `Style profile not found for: ${styleId}` },
      { status: 404 }
    );
  }

  console.log(`📋 Vibe Profile loaded: ${vibeProfile.name}`);

  // Step 2: Chunk products into batches (to avoid token limits)
  const CHUNK_SIZE = 80; // Conservative: ~80 products per chunk (safe for Haiku)
  const chunks: Product[][] = [];

  for (let i = 0; i < products.length; i += CHUNK_SIZE) {
    chunks.push(products.slice(i, i + CHUNK_SIZE));
  }

  console.log(`📦 Split ${products.length} products into ${chunks.length} chunks of ~${CHUNK_SIZE} products each`);

  // Step 3: Score each chunk (sequentially to avoid rate limits)
  const allScores: Record<string, number> = {};

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    console.log(`🤖 Scoring chunk ${i + 1}/${chunks.length} (${chunk.length} products)...`);

    const prompt = buildScoringPrompt(vibeProfile, chunk);
    const chunkScores = await scoreProductsWithClaude(prompt, chunk);

    // Merge chunk scores into main scores object
    Object.assign(allScores, chunkScores);

    // Small delay between chunks to avoid rate limits
    if (i < chunks.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  console.log(`✅ Scored ${Object.keys(allScores).length} products across ${chunks.length} chunks`);

  // Step 4: Merge scores with products
  const rankedProducts: RankedProduct[] = products.map((product) => ({
    ...product,
    aiScore: allScores[product.id] || 0,
  }));

  // Step 5: Sort by AI score (highest first)
  rankedProducts.sort((a, b) => b.aiScore - a.aiScore);

  console.log(`✅ AI-Ranker complete: ${rankedProducts.length} products ranked`);
  console.log(`📊 Score distribution:`);
  console.log(`   10 (Gems): ${rankedProducts.filter(p => p.aiScore === 10).length}`);
  console.log(`   7-9 (Great): ${rankedProducts.filter(p => p.aiScore >= 7 && p.aiScore < 10).length}`);
  console.log(`   3-6 (Medium): ${rankedProducts.filter(p => p.aiScore >= 3 && p.aiScore < 7).length}`);
  console.log(`   0-2 (Trash): ${rankedProducts.filter(p => p.aiScore < 3).length}`);

  return NextResponse.json({
    rankedProducts,
    stats: {
      totalScored: rankedProducts.length,
      averageScore: rankedProducts.reduce((sum, p) => sum + p.aiScore, 0) / rankedProducts.length,
      vibeProfile: vibeProfile.name,
    },
  });
}

/**
 * Streaming ranking with progress updates (SSE)
 */
async function handleStreamingRanking(products: Product[], styleId: string) {
  console.log(`🎯 AI-Ranker (Streaming): Starting for style "${styleId}" with ${products.length} products`);
  const startTime = Date.now();

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const sendProgress = (message: string) => {
        console.log(`📡 Streaming progress: ${message}`);
        const data = `data: ${JSON.stringify({ status: message })}\n\n`;
        controller.enqueue(encoder.encode(data));
      };

      try {
        sendProgress(`Окей... Ищем '${styleId}' вайб...`);

        // Step 1: Extract Vibe Profile
        const vibeProfile = getVibeProfile(styleId);
        if (!vibeProfile) {
          console.error(`❌ Style profile not found: ${styleId}`);
          sendProgress(`❌ Стиль не найден: ${styleId}`);
          controller.close();
          return;
        }

        console.log(`✅ Vibe profile loaded:`, {
          name: vibeProfile.name,
          componentsCount: vibeProfile.tier2_components.length,
          brandsCount: vibeProfile.tier3_bolo_brands.length,
          keywordsCount: vibeProfile.tier4_grail_keywords.length
        });

        sendProgress(`VibeDNA нашел профиль: ${vibeProfile.name}`);
        await new Promise(resolve => setTimeout(resolve, 1000));

        sendProgress(`Получено ${products.length} кандидатов от Vinted...`);
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Step 2: Chunk products
        const CHUNK_SIZE = 80;
        const chunks: Product[][] = [];
        for (let i = 0; i < products.length; i += CHUNK_SIZE) {
          chunks.push(products.slice(i, i + CHUNK_SIZE));
        }

        sendProgress(`Это много. Начинаю AI-ранжирование (${chunks.length} батчей)...`);
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Step 3: Score each chunk with progress updates
        const allScores: Record<string, number> = {};

        for (let i = 0; i < chunks.length; i++) {
          const chunk = chunks[i];

          // Progress message variations
          const messages = [
            `Chunk ${i + 1}/${chunks.length}... Отсеиваю DVD и фуа-гра...`,
            `Chunk ${i + 1}/${chunks.length}... Ищу настоящие гемы...`,
            `Chunk ${i + 1}/${chunks.length}... Проверяю бренды и вайбы...`,
            `Chunk ${i + 1}/${chunks.length}... Удаляю мусор...`,
          ];
          const message = messages[i % messages.length];
          sendProgress(message);

          const prompt = buildScoringPrompt(vibeProfile, chunk);
          const chunkScores = await scoreProductsWithClaude(prompt, chunk);
          Object.assign(allScores, chunkScores);

          // Delay between chunks
          if (i < chunks.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }

        sendProgress(`AI-ранжирование завершено. Сортирую результаты...`);
        await new Promise(resolve => setTimeout(resolve, 500));

        // Step 4: Merge scores and sort
        const rankedProducts: RankedProduct[] = products.map((product) => ({
          ...product,
          aiScore: allScores[product.id] || 0,
        }));

        rankedProducts.sort((a, b) => b.aiScore - a.aiScore);

        const gems = rankedProducts.filter(p => p.aiScore === 10).length;
        const great = rankedProducts.filter(p => p.aiScore >= 7 && p.aiScore < 10).length;
        const medium = rankedProducts.filter(p => p.aiScore >= 3 && p.aiScore < 7).length;
        const trash = rankedProducts.filter(p => p.aiScore < 3).length;

        const totalDuration = Date.now() - startTime;

        console.log(`✅ AI-Ranker (Streaming): Complete in ${totalDuration}ms`);
        console.log(`📊 Final stats:`, {
          totalProducts: rankedProducts.length,
          gems,
          great,
          medium,
          trash,
          avgScore: (rankedProducts.reduce((sum, p) => sum + p.aiScore, 0) / rankedProducts.length).toFixed(2)
        });

        sendProgress(`Готово! Найдено ${gems} гемов и ${great} отличных вещей.`);
        await new Promise(resolve => setTimeout(resolve, 500));

        // Send final result
        const result = {
          rankedProducts,
          stats: {
            totalScored: rankedProducts.length,
            averageScore: rankedProducts.reduce((sum, p) => sum + p.aiScore, 0) / rankedProducts.length,
            vibeProfile: vibeProfile.name,
          },
        };

        const finalData = `data: ${JSON.stringify({ complete: true, result })}\n\n`;
        controller.enqueue(encoder.encode(finalData));

        console.log(`🏁 AI-Ranker (Streaming): Stream closed`);
        controller.close();

      } catch (error: any) {
        console.error(`❌ AI-Ranker (Streaming) error:`, error);
        sendProgress(`❌ Ошибка: ${error.message}`);
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

/**
 * Extract vibe profile from styles-enhanced.json
 */
function getVibeProfile(styleId: string): StyleProfile | null {
  const style = stylesData.styles.find((s: any) => s.id === styleId);
  if (!style) return null;

  // Handle tier3_bolo_brands: can be array or nested object
  let boloBrands: string[] = [];
  if (Array.isArray(style.tier3_bolo_brands)) {
    boloBrands = style.tier3_bolo_brands;
  } else if (typeof style.tier3_bolo_brands === 'object' && style.tier3_bolo_brands !== null) {
    // Flatten nested object structure (e.g., y2k style)
    boloBrands = Object.values(style.tier3_bolo_brands).flat();
  }

  return {
    id: style.id,
    name: style.name,
    description: style.description,
    tier2_components: style.tier2_components || [],
    tier3_bolo_brands: boloBrands,
    tier4_grail_keywords: style.tier4_grail_keywords || [],
    digger_note: style.digger_note || '',
  };
}

/**
 * Build the AI scoring prompt
 */
function buildScoringPrompt(vibeProfile: StyleProfile, products: Product[]): string {
  const productsJson = products.map(p => ({
    id: p.id,
    title: p.title,
    brand: p.brand,
    price: p.price,
    condition: p.condition || 'N/A',
  }));

  return `<system_prompt>
You are the chief curator of "Diggy", a boutique fashion platform for Gen Z. Your task is to review a raw list of products from Vinted and score each one for how well it matches the user's vibe. Be ruthless: filter out all trash, DVDs, food items, and irrelevant products. We only want gems.

== VIBE PROFILE: ${vibeProfile.name} ==
Description: ${vibeProfile.description}
Key Components: ${vibeProfile.tier2_components.join(', ')}
BOLO Brands: ${vibeProfile.tier3_bolo_brands.join(', ')}
Quality Keywords: ${vibeProfile.tier4_grail_keywords.join(', ')}
Curator Note: ${vibeProfile.digger_note}

== TASK ==
Below is a list of product candidates. For EACH product, give a score from 0 to 10.

== SCORING SCALE ==
* **10 (Gem):** Perfect match. Rare, stylish piece that perfectly embodies the vibe (e.g., Arc'teryx Beta jacket for Gorpcore).
* **7-9 (Great):** Very relevant product (e.g., Patagonia fleece, Salomon trail shoes).
* **3-6 (Medium):** On-topic but boring or too generic (e.g., basic hiking pants).
* **0-2 (Trash):** Irrelevant, spam, or just mentions keywords (e.g., DVDs, kitchenware, t-shirt with brand name).

== CANDIDATES FOR SCORING ==
${JSON.stringify(productsJson, null, 2)}

== OUTPUT FORMAT ==
Return ONLY a JSON object in format { "id": score }, where "id" is the product ID and "score" is your rating (0-10).
Example: {"vinted_123": 10, "vinted_456": 2, "vinted_789": 7}

DO NOT include any other text, explanation, or markdown. Only the JSON object.
</system_prompt>`;
}

/**
 * Extract and validate JSON from LLM response
 * Handles: markdown code blocks, trailing commas, nested braces
 */
function extractAndValidateScores(
  responseText: string,
  expectedProductIds: string[]
): Record<string, number> {
  // Step 1: Extract JSON from response (handle markdown code blocks)
  let jsonStr = responseText;

  // Remove markdown code block if present
  const codeBlockMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    jsonStr = codeBlockMatch[1];
  }

  // Find the outermost JSON object (handle nested braces carefully)
  const startIdx = jsonStr.indexOf('{');
  if (startIdx === -1) {
    throw new Error('No JSON object found in response');
  }

  // Find matching closing brace
  let depth = 0;
  let endIdx = -1;
  for (let i = startIdx; i < jsonStr.length; i++) {
    if (jsonStr[i] === '{') depth++;
    if (jsonStr[i] === '}') depth--;
    if (depth === 0) {
      endIdx = i;
      break;
    }
  }

  if (endIdx === -1) {
    throw new Error('Unmatched braces in JSON response');
  }

  jsonStr = jsonStr.substring(startIdx, endIdx + 1);

  // Step 2: Fix common JSON issues
  // Remove trailing commas before closing braces
  jsonStr = jsonStr.replace(/,\s*}/g, '}');
  // Remove trailing commas before closing brackets
  jsonStr = jsonStr.replace(/,\s*]/g, ']');

  // Step 3: Parse JSON
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(jsonStr);
  } catch (parseError: any) {
    console.error('❌ JSON parse error:', parseError.message);
    console.error('Attempted to parse:', jsonStr.substring(0, 200) + '...');
    throw new Error(`Invalid JSON in response: ${parseError.message}`);
  }

  // Step 4: Validate and sanitize scores
  const validatedScores: Record<string, number> = {};
  const expectedIds = new Set(expectedProductIds);

  for (const [id, score] of Object.entries(parsed)) {
    // Check if ID was expected
    if (!expectedIds.has(id)) {
      console.warn(`⚠️  Unexpected product ID in scores: ${id}`);
      continue;
    }

    // Validate score is a number 0-10
    if (typeof score !== 'number') {
      console.warn(`⚠️  Invalid score type for ${id}: ${typeof score}, defaulting to 5`);
      validatedScores[id] = 5;
      continue;
    }

    // Clamp score to 0-10 range
    const clampedScore = Math.max(0, Math.min(10, Math.round(score)));
    if (clampedScore !== score) {
      console.warn(`⚠️  Score out of range for ${id}: ${score} → ${clampedScore}`);
    }
    validatedScores[id] = clampedScore;
  }

  // Step 5: Add default scores for missing products
  for (const id of expectedProductIds) {
    if (!(id in validatedScores)) {
      console.warn(`⚠️  Missing score for product ${id}, defaulting to 5`);
      validatedScores[id] = 5;
    }
  }

  return validatedScores;
}

/**
 * Score products using OpenAI GPT-4o-mini (fast & cheap)
 */
async function scoreProductsWithClaude(
  prompt: string,
  products: Product[]
): Promise<Record<string, number>> {
  console.log(`🤖 OpenAI API: Sending ${products.length} products for scoring...`);
  const startTime = Date.now();

  const expectedProductIds = products.map(p => p.id);

  try {
    const response = await openai.invoke(prompt);
    const responseText = response.content as string;

    const duration = Date.now() - startTime;

    console.log(`⏱️  OpenAI API: Response received in ${duration}ms`);
    console.log(`📊 OpenAI API: Response length: ${responseText.length} characters`);

    // Extract and validate JSON with robust parsing
    const scores = extractAndValidateScores(responseText, expectedProductIds);

    console.log(`✅ OpenAI returned scores for ${Object.keys(scores).length} products`);

    // Log score distribution
    const scoreValues = Object.values(scores);
    const avgScore = scoreValues.reduce((sum, score) => sum + score, 0) / scoreValues.length;
    const gems = scoreValues.filter(s => s === 10).length;
    const great = scoreValues.filter(s => s >= 7 && s < 10).length;
    const medium = scoreValues.filter(s => s >= 3 && s < 7).length;
    const trash = scoreValues.filter(s => s < 3).length;

    console.log(`📈 Score distribution: 10 (gems)=${gems}, 7-9 (great)=${great}, 3-6 (medium)=${medium}, 0-2 (trash)=${trash}`);
    console.log(`📊 Average score: ${avgScore.toFixed(2)}`);

    return scores;

  } catch (error: any) {
    console.error('❌ OpenAI API error:', error.message);
    console.error('Full error:', error);

    // Fallback: return all scores as 5 (medium)
    const fallbackScores: Record<string, number> = {};
    products.forEach(p => {
      fallbackScores[p.id] = 5;
    });

    console.warn(`⚠️  Using fallback scores (all 5) for ${products.length} products`);
    return fallbackScores;
  }
}
