/**
 * Generate VibeDNA vectors for SSENSE brands using GPT-4o
 *
 * Uses same style dimensions as vibe_entities but optimized for curated SSENSE brands.
 * SSENSE brands are typically higher-end, so GPT-4o should have better knowledge of them.
 *
 * Input: data/ssense/ssense-brands.json (from parse-ssense-brands.ts)
 * Output: data/ssense/ssense-vibe-matrix.json
 *
 * Usage:
 *   npx tsx scripts/generate-ssense-vibe-matrix.ts
 *   npx tsx scripts/generate-ssense-vibe-matrix.ts --resume  # Resume from checkpoint
 *   npx tsx scripts/generate-ssense-vibe-matrix.ts --start=100  # Start from brand 100
 */

import fs from 'fs';
import path from 'path';
import { ChatOpenAI } from '@langchain/openai';
import dotenv from 'dotenv';

dotenv.config();

// Configuration
const CHECKPOINT_INTERVAL = 10; // Save progress every N brands
const RATE_LIMIT_DELAY = 1000; // ms between API calls
const MAX_RETRIES = 3;

// Load style definitions
const stylesEnhanced = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), 'data/vinted/styles-enhanced.json'), 'utf-8')
);

const styleIds = stylesEnhanced.styles.map((style: any) => style.id);
console.log(`Found ${styleIds.length} style dimensions:`, styleIds);

// Load SSENSE brands
interface SSENSEBrand {
  brand_name: string;
  ssense_slug: string;
  available_women: boolean;
  available_men: boolean;
}

const dataDir = path.join(process.cwd(), 'data/ssense');
const brandsFile = path.join(dataDir, 'ssense-brands.json');

if (!fs.existsSync(brandsFile)) {
  console.error(`❌ SSENSE brands file not found: ${brandsFile}`);
  console.error('   Run first: npx tsx scripts/parse-ssense-brands.ts');
  process.exit(1);
}

const ssenseBrands: SSENSEBrand[] = JSON.parse(fs.readFileSync(brandsFile, 'utf-8'));
console.log(`Found ${ssenseBrands.length} SSENSE brands to process`);

// Generate enhanced style context block
function generateStyleContextBlock(): string {
  let contextBlock = '== START: STYLE CONTEXT BLOCK ==\n\n';

  for (const style of stylesEnhanced.styles) {
    contextBlock += `Style ID: ${style.id}\n`;
    contextBlock += `Name: ${style.name}\n`;
    contextBlock += `Description: ${style.description}\n`;

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

// System prompt optimized for high-end/designer brands
const SYSTEM_PROMPT_TEMPLATE = `You are an elite fashion historian and luxury fashion expert 'Diggy'. Your task is to analyze a designer brand and generate its "VibeDNA" (style DNA vector).

This brand is from SSENSE, a curated luxury fashion retailer. SSENSE carries designer, avant-garde, and contemporary brands.

1. Study the "STYLE CONTEXT BLOCK" below carefully.
2. Analyze the brand I provide - consider its:
   - Design philosophy and aesthetic
   - Target demographic and price point
   - Fashion week presence and critical reception
   - Cultural associations and celebrity clientele
3. Rate relevance to *each* style from 0.0 to 1.0:
   - 1.0 = Perfect embodiment (Rick Owens for "goth/avantgarde")
   - 0.7-0.9 = Strong association
   - 0.4-0.6 = Moderate relevance
   - 0.1-0.3 = Slight connection
   - 0.0 = No connection
4. Designer brands often span multiple aesthetics. Identify ALL relevant connections.
5. Consider both mainline collections AND diffusion lines if applicable.

${CONTEXT_BLOCK}

<brand_to_analyze>
{BRAND_NAME}
</brand_to_analyze>

Additional context: This brand is sold on SSENSE, indicating it's at least contemporary/designer tier.
Gender availability: {GENDER_INFO}

Output ONLY a JSON object. Keys must be exactly these style IDs: ${JSON.stringify(styleIds)}
Values must be float scores 0.0-1.0.

Example output for "Maison Margiela":
{
  "casual": 0.2,
  "formal": 0.3,
  "sporty": 0.0,
  "vintage": 0.4,
  "bohemian": 0.0,
  "y2k": 0.3,
  "grunge": 0.2,
  "goth": 0.4,
  "techwear": 0.2,
  "gorpcore": 0.0,
  "academia": 0.2,
  "avantgarde": 0.95,
  "streetwear": 0.3,
  "cottagecore": 0.0,
  "clubkid": 0.3,
  "balletcore": 0.0,
  "kfashion": 0.0,
  "harajuku": 0.0,
  "minimaljapan": 0.6,
  "deconstructed": 0.95,
  "eclecticgrandpa": 0.1,
  "mobwife": 0.0,
  "blokecore": 0.0,
  "officesiren": 0.2
}`;

// Initialize LLM
const model = new ChatOpenAI({
  modelName: 'gpt-4o',
  temperature: 0.3,
  maxTokens: 1000,
});

// Process single brand
async function generateVibeDNAForBrand(
  brand: SSENSEBrand
): Promise<Record<string, number> | null> {
  const genderInfo = [
    brand.available_women ? 'Women' : '',
    brand.available_men ? 'Men' : '',
  ].filter(Boolean).join(' & ') || 'Unknown';

  const prompt = SYSTEM_PROMPT_TEMPLATE
    .replace('{BRAND_NAME}', brand.brand_name)
    .replace('{GENDER_INFO}', genderInfo);

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await model.invoke(prompt);
      const content = response.content as string;

      // Extract JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error(`   ❌ No JSON found (attempt ${attempt})`);
        continue;
      }

      const vibeDNA = JSON.parse(jsonMatch[0]);

      // Validate all style IDs
      const missingIds = styleIds.filter((id: string) => !(id in vibeDNA));
      if (missingIds.length > 0) {
        console.warn(`   ⚠️  Missing styles: ${missingIds.join(', ')}`);
        missingIds.forEach((id: string) => vibeDNA[id] = 0.0);
      }

      // Normalize scores to 0.0-1.0 range
      for (const key of Object.keys(vibeDNA)) {
        vibeDNA[key] = Math.max(0, Math.min(1, parseFloat(vibeDNA[key]) || 0));
      }

      return vibeDNA;
    } catch (error: any) {
      console.error(`   ❌ Error (attempt ${attempt}): ${error.message}`);
      if (attempt < MAX_RETRIES) {
        await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
      }
    }
  }

  return null;
}

// Load checkpoint if exists
function loadCheckpoint(): {
  matrix: Record<string, Record<string, number>>;
  lastIndex: number;
} {
  const checkpointFile = path.join(dataDir, 'ssense-vibe-matrix-checkpoint.json');

  if (fs.existsSync(checkpointFile)) {
    const checkpoint = JSON.parse(fs.readFileSync(checkpointFile, 'utf-8'));
    console.log(`📂 Loaded checkpoint: ${Object.keys(checkpoint.matrix).length} brands processed`);
    return checkpoint;
  }

  return { matrix: {}, lastIndex: -1 };
}

// Save checkpoint
function saveCheckpoint(
  matrix: Record<string, Record<string, number>>,
  lastIndex: number
): void {
  const checkpointFile = path.join(dataDir, 'ssense-vibe-matrix-checkpoint.json');
  fs.writeFileSync(checkpointFile, JSON.stringify({ matrix, lastIndex }, null, 2));
}

// Main processing function
async function generateSSENSEVibeMatrix() {
  console.log('\n🚀 Starting SSENSE brand vectorization...\n');

  // Parse CLI args
  const args = process.argv.slice(2);
  const shouldResume = args.includes('--resume');
  const startFromArg = args.find(a => a.startsWith('--start='));
  const startFrom = startFromArg ? parseInt(startFromArg.split('=')[1]) : 0;

  // Load checkpoint if resuming
  let { matrix, lastIndex } = shouldResume ? loadCheckpoint() : { matrix: {}, lastIndex: -1 };
  const startIndex = shouldResume ? lastIndex + 1 : startFrom;

  console.log(`📊 Starting from index: ${startIndex}`);
  console.log(`📊 Brands to process: ${ssenseBrands.length - startIndex}\n`);

  const failedBrands: SSENSEBrand[] = [];

  for (let i = startIndex; i < ssenseBrands.length; i++) {
    const brand = ssenseBrands[i];
    const progress = `[${i + 1}/${ssenseBrands.length}]`;

    console.log(`${progress} Processing: ${brand.brand_name}`);

    const vibeDNA = await generateVibeDNAForBrand(brand);

    if (vibeDNA) {
      matrix[brand.brand_name] = vibeDNA;

      // Show top styles
      const topStyles = Object.entries(vibeDNA)
        .filter(([_, score]) => score > 0.3)
        .sort(([_, a], [__, b]) => b - a)
        .slice(0, 3)
        .map(([style, score]) => `${style}:${score.toFixed(2)}`)
        .join(', ');

      console.log(`   ✅ Success! Top: ${topStyles || 'none > 0.3'}`);
    } else {
      failedBrands.push(brand);
      console.log(`   ❌ Failed - will retry later`);
    }

    // Save checkpoint periodically
    if ((i + 1) % CHECKPOINT_INTERVAL === 0) {
      saveCheckpoint(matrix, i);
      console.log(`   💾 Checkpoint saved at index ${i}`);
    }

    // Rate limiting
    if (i < ssenseBrands.length - 1) {
      await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY + Math.random() * 500));
    }
  }

  // Retry failed brands
  if (failedBrands.length > 0) {
    console.log(`\n\n🔄 Retrying ${failedBrands.length} failed brands...\n`);

    for (const brand of failedBrands) {
      console.log(`Retry: ${brand.brand_name}`);
      const vibeDNA = await generateVibeDNAForBrand(brand);

      if (vibeDNA) {
        matrix[brand.brand_name] = vibeDNA;
        console.log(`   ✅ Retry successful!`);
      } else {
        console.log(`   ❌ Retry failed - brand omitted`);
      }

      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  // Save final matrix
  const outputFile = path.join(dataDir, 'ssense-vibe-matrix.json');
  fs.writeFileSync(outputFile, JSON.stringify(matrix, null, 2));

  // Remove checkpoint after successful completion
  const checkpointFile = path.join(dataDir, 'ssense-vibe-matrix-checkpoint.json');
  if (fs.existsSync(checkpointFile)) {
    fs.unlinkSync(checkpointFile);
  }

  // Statistics
  console.log('\n' + '═'.repeat(60));
  console.log('📊 VECTORIZATION SUMMARY');
  console.log('═'.repeat(60));
  console.log(`✅ Processed: ${Object.keys(matrix).length}/${ssenseBrands.length} brands`);
  console.log(`❌ Failed:    ${ssenseBrands.length - Object.keys(matrix).length} brands`);
  console.log(`💾 Output:    ${outputFile}`);
  console.log('═'.repeat(60));

  // Show style distribution
  console.log('\n📈 Average scores by style:');
  const avgScores: Record<string, number> = {};
  for (const styleId of styleIds) {
    const sum = Object.values(matrix).reduce((acc, scores) => acc + (scores[styleId] || 0), 0);
    avgScores[styleId] = sum / Object.keys(matrix).length;
  }

  Object.entries(avgScores)
    .sort(([_, a], [__, b]) => b - a)
    .slice(0, 10)
    .forEach(([style, avg]) => {
      console.log(`   ${style}: ${avg.toFixed(3)}`);
    });

  console.log('\n✅ Vectorization complete!');
  console.log('\n📋 Next step:');
  console.log('   npx tsx scripts/ingest-ssense-brands.ts');
}

// Run
generateSSENSEVibeMatrix().catch(console.error);
