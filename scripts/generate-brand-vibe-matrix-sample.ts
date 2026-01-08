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

// Clean and parse brands list - LIMIT TO 50 for sample
const brandsList = brandsText
  .split('\n')
  .map(line => line.trim())
  .filter(line => line.length > 0 && !line.startsWith('#'))
  .map(brand => brand.replace(/^["*]+|["*]+$/g, '').trim())
  .filter((brand, index, self) => self.indexOf(brand) === index)
  .slice(0, 50); // ONLY FIRST 50 BRANDS

console.log(`Processing SAMPLE of ${brandsList.length} brands`);

// Generate Style Context Block
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
The values should be your scores (float 0.0-1.0).`;

const model = new ChatOpenAI({
  modelName: 'gpt-4o-mini', // Using mini for speed
  temperature: 0.3,
  maxTokens: 1000,
});

async function generateVibeDNAForBrand(brandName: string): Promise<Record<string, number> | null> {
  try {
    const prompt = SYSTEM_PROMPT_TEMPLATE.replace('{BRAND_NAME}', brandName);
    const response = await model.invoke(prompt);
    const content = response.content as string;

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error(`❌ No JSON found for: ${brandName}`);
      return null;
    }

    const vibeDNA = JSON.parse(jsonMatch[0]);

    const missingIds = styleIds.filter(id => !(id in vibeDNA));
    if (missingIds.length > 0) {
      missingIds.forEach(id => vibeDNA[id] = 0.0);
    }

    return vibeDNA;
  } catch (error: any) {
    console.error(`❌ Error processing "${brandName}":`, error.message);
    return null;
  }
}

async function generateBrandVibeMatrix() {
  console.log('\n🚀 Starting SAMPLE brand-vibe-matrix generation...\n');

  const finalMatrix: Record<string, Record<string, number>> = {};
  let processedCount = 0;

  for (const brand of brandsList) {
    processedCount++;
    console.log(`[${processedCount}/${brandsList.length}] ${brand}`);

    const vibeDNA = await generateVibeDNAForBrand(brand);

    if (vibeDNA) {
      finalMatrix[brand] = vibeDNA;
      const topScores = Object.entries(vibeDNA)
        .filter(([_, score]) => score > 0.3)
        .sort(([_, a], [__, b]) => b - a)
        .slice(0, 3)
        .map(([style, score]) => `${style}:${score}`)
        .join(', ');
      console.log(`✅ ${topScores || 'neutral brand'}\n`);
    }

    // Rate limiting
    if (processedCount < brandsList.length) {
      await new Promise(resolve => setTimeout(resolve, 800));
    }
  }

  // Save
  const outputPath = path.join(process.cwd(), 'data/vinted/brand-vibe-matrix-sample.json');
  fs.writeFileSync(outputPath, JSON.stringify(finalMatrix, null, 2), 'utf-8');

  console.log(`\n✅ SAMPLE COMPLETED!`);
  console.log(`📊 Processed: ${Object.keys(finalMatrix).length} brands`);
  console.log(`💾 Saved to: ${outputPath}`);
}

generateBrandVibeMatrix().catch(console.error);
