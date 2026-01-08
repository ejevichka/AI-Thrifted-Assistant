import fs from 'fs';
import path from 'path';
import { ChatOpenAI } from '@langchain/openai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Load input files
const stylesEnhanced = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), 'data/vinted/styles-enhanced.json'), 'utf-8')
);

const brandsText = fs.readFileSync(
  path.join(process.cwd(), 'data/vinted/favorite-brands.txt'),
  'utf-8'
);

// Extract style IDs (dimensions)
const styleIds = stylesEnhanced.styles.map((style: any) => style.id);
console.log(`Found ${styleIds.length} style dimensions:`, styleIds);

// Clean and parse brands list
const brandsList = brandsText
  .split('\n')
  .map(line => line.trim())
  .filter(line => line.length > 0 && !line.startsWith('#'))
  .map(brand => brand.replace(/^["*]+|["*]+$/g, '').trim()) // Remove quotes and asterisks
  .filter((brand, index, self) => self.indexOf(brand) === index); // Remove duplicates

console.log(`Found ${brandsList.length} brands to process`);

// Generate Style Context Block
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
      // Handle nested structure like in y2k, vintage styles
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
console.log('\nGenerated context block length:', CONTEXT_BLOCK.length);

// System prompt template
const SYSTEM_PROMPT_TEMPLATE = `You are an elite fashion historian and fashion curator 'Diggy'. Your task is to analyze a brand and generate its "VibeDNA" (vibe DNA vector).

1. Carefully study the "STYLE CONTEXT BLOCK" below. This is your "brain" and the only truth.
2. Analyze the brand I will provide.
3. Rate the relevance of this brand to *each* style from the "CONTEXT BLOCK" on a scale from 0.0 (no connection) to 1.0 (perfect embodiment of the style, like "Rick Owens" for "goth").
4. Many brands (e.g., "Cop Copine") will have high scores in multiple styles at once ("y2k", "deconstructed", "techwear", "officesiren"). Your task is to accurately identify all these connections.
5. If the brand is completely unknown or has no relation to any style, assign 0.0 or 0.1 to all styles.

${CONTEXT_BLOCK}

Now, based *only* on this context, analyze the following brand.

<brand_to_analyze>
{BRAND_NAME}
</brand_to_analyze>

Output your response EXCLUSIVELY as a single JSON object. Do not write anything except JSON.
The keys in JSON should be *only* style IDs from this list: ${JSON.stringify(styleIds)}
The values should be your scores (float 0.0-1.0).

Example of perfect output for brand "Cop Copine":
{
  "casual": 0.0,
  "formal": 0.0,
  "sporty": 0.0,
  "vintage": 0.4,
  "bohemian": 0.0,
  "y2k": 0.9,
  "grunge": 0.1,
  "goth": 0.0,
  "techwear": 0.5,
  "gorpcore": 0.0,
  "academia": 0.0,
  "avantgarde": 0.3,
  "streetwear": 0.1,
  "cottagecore": 0.0,
  "clubkid": 0.2,
  "balletcore": 0.0,
  "kfashion": 0.0,
  "harajuku": 0.0,
  "minimaljapan": 0.0,
  "deconstructed": 0.7,
  "eclecticgrandpa": 0.0,
  "mobwife": 0.0,
  "blokecore": 0.0,
  "officesiren": 0.3
}`;

// Initialize LLM
const model = new ChatOpenAI({
  modelName: 'gpt-4o', // Using GPT-4o for quality, can switch to gpt-4o-mini for speed
  temperature: 0.3,
  maxTokens: 1000,
});

// Process single brand
async function generateVibeDNAForBrand(brandName: string): Promise<Record<string, number> | null> {
  try {
    const prompt = SYSTEM_PROMPT_TEMPLATE.replace('{BRAND_NAME}', brandName);

    const response = await model.invoke(prompt);
    const content = response.content as string;

    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error(`❌ No JSON found in response for brand: ${brandName}`);
      return null;
    }

    const vibeDNA = JSON.parse(jsonMatch[0]);

    // Validate all style IDs are present
    const missingIds = styleIds.filter(id => !(id in vibeDNA));
    if (missingIds.length > 0) {
      console.warn(`⚠️  Brand ${brandName}: Missing style IDs: ${missingIds.join(', ')}`);
      // Fill missing with 0.0
      missingIds.forEach(id => vibeDNA[id] = 0.0);
    }

    return vibeDNA;
  } catch (error: any) {
    console.error(`❌ Error processing brand "${brandName}":`, error.message);
    return null;
  }
}

// Main processing loop
async function generateBrandVibeMatrix() {
  console.log('\n🚀 Starting brand-vibe-matrix generation...\n');

  const finalMatrix: Record<string, Record<string, number>> = {};
  const failedBrands: string[] = [];

  let processedCount = 0;
  const totalBrands = brandsList.length;

  for (const brand of brandsList) {
    processedCount++;
    console.log(`\n[${processedCount}/${totalBrands}] Processing: ${brand}`);

    const vibeDNA = await generateVibeDNAForBrand(brand);

    if (vibeDNA) {
      finalMatrix[brand] = vibeDNA;
      console.log(`✅ Success! Top scores: ${Object.entries(vibeDNA)
        .filter(([_, score]) => score > 0.3)
        .sort(([_, a], [__, b]) => b - a)
        .slice(0, 3)
        .map(([style, score]) => `${style}:${score}`)
        .join(', ')}`);
    } else {
      failedBrands.push(brand);
      console.log(`⚠️  Failed - will retry later`);
    }

    // Rate limiting: wait between requests
    if (processedCount < totalBrands) {
      const delay = 1000 + Math.random() * 1000; // 1-2 seconds
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  // Retry failed brands
  if (failedBrands.length > 0) {
    console.log(`\n\n🔄 Retrying ${failedBrands.length} failed brands...\n`);

    for (const brand of failedBrands) {
      console.log(`Retry: ${brand}`);
      const vibeDNA = await generateVibeDNAForBrand(brand);

      if (vibeDNA) {
        finalMatrix[brand] = vibeDNA;
        console.log(`✅ Retry successful!`);
      } else {
        console.log(`❌ Retry failed - brand will be omitted from final matrix`);
      }

      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  // Save final matrix
  const outputPath = path.join(process.cwd(), 'data/vinted/brand-vibe-matrix.json');
  fs.writeFileSync(outputPath, JSON.stringify(finalMatrix, null, 2), 'utf-8');

  console.log(`\n\n✅ COMPLETED!`);
  console.log(`📊 Processed: ${Object.keys(finalMatrix).length}/${totalBrands} brands`);
  console.log(`💾 Saved to: ${outputPath}`);
  console.log(`❌ Failed: ${totalBrands - Object.keys(finalMatrix).length} brands`);
}

// Run the script
generateBrandVibeMatrix().catch(console.error);
