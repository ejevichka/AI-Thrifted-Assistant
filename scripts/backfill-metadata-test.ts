import fs from 'fs';
import path from 'path';
import { ChatOpenAI } from '@langchain/openai';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
dotenv.config();

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Load styles-enhanced.json for context
const stylesEnhanced = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), 'data/vinted/styles-enhanced.json'), 'utf-8')
);

// Generate Style Context Block for RAG
function generateStyleContextBlock(): string {
  let contextBlock = '== START: STYLE CONTEXT BLOCK ==\n\n';

  for (const style of stylesEnhanced.styles) {
    contextBlock += `Style ID: ${style.id}\n`;
    contextBlock += `Name: ${style.name}\n`;
    contextBlock += `Description: ${style.description}\n`;

    // Extract brands from tier3_bolo_brands
    const brands: string[] = [];
    if (Array.isArray(style.tier3_bolo_brands)) {
      brands.push(...style.tier3_bolo_brands);
    } else if (typeof style.tier3_bolo_brands === 'object') {
      Object.values(style.tier3_bolo_brands).forEach((brandArray: any) => {
        if (Array.isArray(brandArray)) {
          brands.push(...brandArray);
        }
      });
    }

    if (brands.length > 0) {
      contextBlock += `Known Brands: ${brands.slice(0, 15).join(', ')}\n`;
    }

    contextBlock += `Digger Note: ${style.digger_note}\n\n`;
  }

  contextBlock += '== END: STYLE CONTEXT BLOCK ==';
  return contextBlock;
}

const CONTEXT_BLOCK = generateStyleContextBlock();

// System prompt for metadata generation
const SYSTEM_PROMPT = `Ты — элитный фешн-куратор "Diggy". Твоя задача — проанализировать бренд и сгенерировать для него "паспорт" (metadata) в виде СТРОГОГО JSON.

== 1. КОНТЕКСТ СТИЛЕЙ (Твои знания) ==
${CONTEXT_BLOCK}
== END OF CONTEXT ==

== 2. ТВОЯ ЗАДАЧА ==
Проанализируй бренд ниже и верни ТОЛЬКО JSON-объект со следующими 4 ключами:

1.  \`tier\`: (String) Оцени кураторский уровень.
    * \`"icon"\`: Эталон, "святой грааль" вайба (Rick Owens, Margiela, Arc'teryx).
    * \`"gem"\`: "Скрытая жемчужина", бренд для "диггеров" (Cop Copine, Save the Queen!, BELCCI, Julius_7).
    * \`"affordable"\`: Качественная, доступная база или альтернатива (COS, Arket, Uniqlo).
    * \`"mainstream"\`: Обычный масс-маркет (Esprit, H&M, Zara).

2.  \`avg_price\`: (String) Оцени ценовой сегмент (на Vinted/в ресейле).
    * \`"low"\`: (до $30)
    * \`"mid"\`: ($30 - $100)
    * \`"high"\`: ($100 - $400)
    * \`"luxury"\`: ($400+)

3.  \`context_tags\`: (Array of Strings) Добавь 1-3 тега эры или происхождения.
    * Допустимые значения: "france", "italy", "japan", "usa", "uk", "scandi", "80s", "90s", "y2k", "2000s"

4.  \`core_category\`: (String) Основная специализация бренда.
    * Допустимые значения: "footwear", "outerwear", "denim", "knitwear", "accessories", "full_range"

== 3. ПРИМЕРЫ ВЫВОДА ==

<brand_to_analyze>Rick Owens</brand_to_analyze>
<output>
{"tier": "icon", "avg_price": "high", "context_tags": ["usa", "90s", "2000s"], "core_category": "full_range"}
</output>

<brand_to_analyze>Cop Copine</brand_to_analyze>
<output>
{"tier": "gem", "avg_price": "mid", "context_tags": ["france", "y2k", "90s"], "core_category": "full_range"}
</output>

<brand_to_analyze>Esprit</brand_to_analyze>
<output>
{"tier": "mainstream", "avg_price": "low", "context_tags": ["usa", "90s"], "core_category": "full_range"}
</output>

== 4. НАЧНИ РАБОТУ ==
Проанализируй следующий бренд и верни ТОЛЬКО JSON "паспорт".

<brand_to_analyze>
{brand_name}
</brand_to_analyze>

Верни ТОЛЬКО валидный JSON объект, без дополнительного текста.`;

// Initialize LLM
const model = new ChatOpenAI({
  modelName: 'gpt-4o-mini', // Using mini for cost efficiency
  temperature: 0.2,
  maxTokens: 300,
});

// Type definitions
interface BrandMetadata {
  tier: 'icon' | 'gem' | 'affordable' | 'mainstream';
  avg_price: 'low' | 'mid' | 'high' | 'luxury';
  context_tags: string[];
  core_category: 'footwear' | 'outerwear' | 'denim' | 'knitwear' | 'accessories' | 'full_range';
}

// Generate metadata for a single brand
async function generateMetadataForBrand(brandName: string): Promise<BrandMetadata | null> {
  try {
    const prompt = SYSTEM_PROMPT.replace('{brand_name}', brandName);

    const response = await model.invoke(prompt);
    const content = response.content as string;

    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error(`❌ No JSON found in response for brand: ${brandName}`);
      console.error(`Response was: ${content}`);
      return null;
    }

    const metadata = JSON.parse(jsonMatch[0]) as BrandMetadata;

    // Validate required fields
    if (!metadata.tier || !metadata.avg_price || !metadata.context_tags || !metadata.core_category) {
      console.error(`❌ Invalid metadata structure for brand: ${brandName}`);
      return null;
    }

    return metadata;
  } catch (error: any) {
    console.error(`❌ Error generating metadata for "${brandName}":`, error.message);
    return null;
  }
}

// Fetch brands without metadata from database (limit to 5 for testing)
async function fetchBrandsWithoutMetadata(): Promise<{ id: number; entity_name: string }[]> {
  const { data, error } = await supabase
    .from('vibe_entities')
    .select('id, entity_name, metadata')
    .eq('entity_type', 'brand')
    .or('metadata->>tier.is.null,metadata.is.null')
    .limit(5);

  if (error) {
    console.error('❌ Error fetching brands:', error);
    return [];
  }

  return data || [];
}

// Update brand metadata in database
async function updateBrandMetadata(brandId: number, metadata: BrandMetadata): Promise<boolean> {
  const { error } = await supabase
    .from('vibe_entities')
    .update({
      metadata: metadata as any,
      updated_at: new Date().toISOString()
    })
    .eq('id', brandId);

  if (error) {
    console.error(`❌ Error updating brand ${brandId}:`, error);
    return false;
  }

  return true;
}

// Main backfill function
async function backfillBrandMetadataTest() {
  console.log('\n🧪 Starting TEST metadata backfill (5 brands max)...\n');

  // Fetch brands without metadata
  const brandsToProcess = await fetchBrandsWithoutMetadata();
  console.log(`📊 Found ${brandsToProcess.length} brands without metadata\n`);

  if (brandsToProcess.length === 0) {
    console.log('✅ All brands already have metadata!');
    return;
  }

  const successfulUpdates: string[] = [];
  const failedUpdates: string[] = [];
  let processedCount = 0;

  for (const brand of brandsToProcess) {
    processedCount++;
    console.log(`\n[${processedCount}/${brandsToProcess.length}] Processing: ${brand.entity_name}`);

    // Generate metadata
    const metadata = await generateMetadataForBrand(brand.entity_name);

    if (metadata) {
      console.log(`   Generated: ${JSON.stringify(metadata, null, 2)}`);

      // Update database
      const success = await updateBrandMetadata(brand.id, metadata);

      if (success) {
        successfulUpdates.push(brand.entity_name);
        console.log(`✅ Success! tier:${metadata.tier}, price:${metadata.avg_price}, tags:[${metadata.context_tags.join(', ')}]`);
      } else {
        failedUpdates.push(brand.entity_name);
        console.log(`⚠️  Failed to update database`);
      }
    } else {
      failedUpdates.push(brand.entity_name);
      console.log(`⚠️  Failed to generate metadata`);
    }

    // Rate limiting: wait between requests
    if (processedCount < brandsToProcess.length) {
      const delay = 1500;
      console.log(`   Waiting ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  // Final report
  console.log(`\n\n✅ TEST COMPLETED!`);
  console.log(`📊 Statistics:`);
  console.log(`   ✅ Successful: ${successfulUpdates.length}`);
  console.log(`   ❌ Failed: ${failedUpdates.length}`);
  console.log(`   📈 Success rate: ${((successfulUpdates.length / brandsToProcess.length) * 100).toFixed(1)}%`);

  if (failedUpdates.length > 0) {
    console.log(`\n❌ Failed brands:`);
    failedUpdates.forEach(name => console.log(`   - ${name}`));
  }

  console.log(`\n💡 If test is successful, run full backfill with: npm run backfill-metadata`);
}

// Run the script
backfillBrandMetadataTest().catch(console.error);
