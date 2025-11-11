import fs from "fs";
import path from "path";
import { config } from "dotenv";
import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage } from "@langchain/core/messages";
import stylesData from "../data/vinted/styles.json";
import brandsClassified from "../data/vinted/brands-classified.json";

// Load environment variables
config();

// Load user's favorite brands
const favoriteBrandsPath = path.join(process.cwd(), 'data/vinted/favorite-brands.txt');
const favoriteBrandsText = fs.existsSync(favoriteBrandsPath)
  ? fs.readFileSync(favoriteBrandsPath, 'utf-8')
  : '';
const favoriteBrands = favoriteBrandsText
  .split('\n')
  .map(line => line.trim())
  .filter(line => line.length > 0)
  .map(brand => brand.replace(/^["*]+|["*]+$/g, '').trim());

console.log(`📋 Loaded ${favoriteBrands.length} curated favorite brands from favorite-brands.txt`);

interface AestheticMatrix {
  aesthetic: string;
  aestheticId: string;
  description: string;
  luxuryBrands: LuxuryBrandProfile[];
  globalSearchKeywords: string[];
}

interface LuxuryBrandProfile {
  name: string;
  priceRange: string;
  aestheticKeywords: string[];      // What makes this brand this aesthetic
  searchTerms: string[];            // Vinted search terms
  affordableAlternatives: AffordableAlternative[];
}

interface AffordableAlternative {
  name: string;
  matchScore: number;              // 0-100
  sharedKeywords: string[];        // What they have in common
  searchTerms: string[];           // Specific search terms for this brand
}

/**
 * AI-powered aesthetic matrix generator
 * Uses GPT-4 to analyze brands and find affordable alternatives
 */

async function generateAestheticMatrix() {
  console.log("🚀 Starting AI-powered aesthetic matrix generation...\n");

  const model = new ChatOpenAI({
    modelName: "gpt-4o",
    temperature: 0.7,
  });

  const allMatrices: AestheticMatrix[] = [];
  const { styles } = stylesData;

  console.log(`📊 Processing ${styles.length} aesthetics...\n`);

  for (let i = 0; i < styles.length; i++) {
    const style = styles[i];
    const progress = `[${i + 1}/${styles.length}]`;

    console.log(`${progress} Processing: ${style.name}`);
    console.log(`   Description: ${style.description}`);

    try {
      // Get luxury brands for this aesthetic from brands-classified.json
      const relevantBrands = brandsClassified.brandDatabase.filter(b =>
        b.category === "Trendy/Designer" &&
        style.brands.some(sb => sb.toLowerCase().includes(b.brand.toLowerCase()))
      );

      console.log(`   Found ${relevantBrands.length} luxury brands in database`);

      if (relevantBrands.length === 0) {
        console.log(`   ⚠️  No luxury brands found in database, using brands from styles.json`);
      }

      // Prepare prompt for AI
      const prompt = `You are a fashion expert specializing in brand analysis and affordable alternatives.

AESTHETIC: ${style.name}
DESCRIPTION: ${style.description}
HASHTAGS: ${style.hashtags.join(", ")}

LUXURY BRANDS FOR THIS AESTHETIC:
${relevantBrands.length > 0
  ? relevantBrands.map(b => `- ${b.brand} (vibe: ${b.vibeTags.join(", ")})`).join("\n")
  : style.brands.slice(0, 10).join(", ")
}

🎯 CURATED BRAND DATABASE (VERIFIED AVAILABLE ON VINTED):
You have access to ${favoriteBrands.length} brands that are CONFIRMED to exist on Vinted.
When suggesting affordable alternatives, YOU MUST ONLY use brands from this list:

${favoriteBrands.slice(0, 200).join(", ")}

(and ${favoriteBrands.length - 200} more brands available in the database...)

YOUR TASK:
For each luxury brand above, provide:

1. **Aesthetic Keywords** (3-5 keywords that define this brand's aesthetic in this style)
   Example for Rick Owens in Avant Garde: ["draped silhouette", "asymmetric cut", "elongated proportions", "monochrome", "raw edges"]

2. **Vinted Search Terms** (3-5 specific search terms that would find similar items)
   Example: ["draped jacket", "asymmetric coat", "elongated tee", "Rick Owens style"]

3. **Affordable Alternatives** (3-5 brands from the CURATED DATABASE that match this aesthetic)
   Requirements:
   - MUST choose ONLY from the curated brand list above
   - Pick brands that genuinely match the luxury brand's aesthetic
   - For each alternative, explain WHY it matches (shared aesthetic features)
   - Provide accurate match scores based on aesthetic similarity

   Example for Rick Owens alternatives:
   - Aakasha (85% match: draped silhouettes, asymmetric cuts, dark palette)
   - Imperial (75% match: elongated proportions, minimal aesthetic)
   - AnnaRita N (70% match: architectural draping, monochrome)

4. **Global Search Keywords** for the overall aesthetic (5-7 keywords that capture the essence)
   Example for Avant Garde: ["deconstructed", "asymmetric", "architectural", "draped", "sculptural", "oversized", "raw edges"]

CRITICAL RULES:
- DO NOT invent or suggest brands outside the curated list
- ALL affordable alternatives MUST come from the provided brand database
- If you cannot find good matches in the database, use fewer alternatives (minimum 2)
- Focus on brands you recognize from the list that fit the aesthetic

Return your analysis in this EXACT JSON format:
{
  "globalSearchKeywords": ["keyword1", "keyword2", ...],
  "brands": [
    {
      "name": "Brand Name",
      "aestheticKeywords": ["keyword1", "keyword2", "keyword3"],
      "searchTerms": ["search1", "search2", "search3"],
      "alternatives": [
        {
          "name": "Alternative Brand",
          "matchScore": 85,
          "sharedKeywords": ["keyword1", "keyword2"],
          "searchTerms": ["alt search1", "alt search2"]
        }
      ]
    }
  ]
}`;

      console.log(`   🤖 Calling AI...`);

      const message = new HumanMessage({ content: prompt });
      const response = await model.invoke([message]);
      const rawContent = response.content as string;

      // Parse JSON from response
      const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("AI did not return valid JSON");
      }

      const aiResult = JSON.parse(jsonMatch[0]);

      // Transform to our format
      const aestheticMatrix: AestheticMatrix = {
        aesthetic: style.name,
        aestheticId: style.id,
        description: style.description,
        globalSearchKeywords: aiResult.globalSearchKeywords || [],
        luxuryBrands: aiResult.brands.map((b: any) => ({
          name: b.name,
          priceRange: "high",
          aestheticKeywords: b.aestheticKeywords || [],
          searchTerms: b.searchTerms || [],
          affordableAlternatives: b.alternatives.map((alt: any) => ({
            name: alt.name,
            matchScore: alt.matchScore || 70,
            sharedKeywords: alt.sharedKeywords || [],
            searchTerms: alt.searchTerms || []
          }))
        }))
      };

      allMatrices.push(aestheticMatrix);

      console.log(`   ✓ Generated matrix with ${aestheticMatrix.luxuryBrands.length} brands`);
      console.log(`   ✓ Found ${aestheticMatrix.luxuryBrands.reduce((acc, b) => acc + b.affordableAlternatives.length, 0)} total alternatives\n`);

      // Save progress after each aesthetic
      const outputDir = path.join(process.cwd(), 'data', 'vinted');
      const progressPath = path.join(outputDir, 'aesthetic-matrix-progress.json');
      fs.writeFileSync(progressPath, JSON.stringify(allMatrices, null, 2));

      // Delay to avoid rate limiting
      await new Promise(r => setTimeout(r, 2000));

    } catch (error: any) {
      console.error(`   ❌ Error: ${error.message}`);
      console.log(`   Continuing with next aesthetic...\n`);
    }
  }

  // Save final matrix
  const outputDir = path.join(process.cwd(), 'data', 'vinted');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const finalPath = path.join(outputDir, 'aesthetic-brand-matrix.json');
  fs.writeFileSync(finalPath, JSON.stringify({
    generated: new Date().toISOString(),
    totalAesthetics: allMatrices.length,
    matrices: allMatrices
  }, null, 2));

  // Statistics
  console.log("\n" + "=".repeat(60));
  console.log("✅ MATRIX GENERATION COMPLETE!");
  console.log("=".repeat(60));
  console.log(`📦 Total aesthetics processed: ${allMatrices.length}`);
  console.log(`🏷️  Total luxury brands: ${allMatrices.reduce((acc, m) => acc + m.luxuryBrands.length, 0)}`);
  console.log(`💰 Total affordable alternatives: ${allMatrices.reduce((acc, m) =>
    acc + m.luxuryBrands.reduce((acc2, b) => acc2 + b.affordableAlternatives.length, 0), 0
  )}`);
  console.log(`📁 Saved to: ${finalPath}`);

  // Show sample
  if (allMatrices.length > 0) {
    const sample = allMatrices[0];
    console.log(`\n📋 Sample (${sample.aesthetic}):`);
    console.log(`   Global keywords: ${sample.globalSearchKeywords.join(", ")}`);
    if (sample.luxuryBrands.length > 0) {
      const brand = sample.luxuryBrands[0];
      console.log(`   Example brand: ${brand.name}`);
      console.log(`   - Aesthetic keywords: ${brand.aestheticKeywords.join(", ")}`);
      console.log(`   - Search terms: ${brand.searchTerms.join(", ")}`);
      if (brand.affordableAlternatives.length > 0) {
        console.log(`   - Alternatives: ${brand.affordableAlternatives.map(a => a.name).join(", ")}`);
      }
    }
  }

  return allMatrices;
}

// Run the generator
generateAestheticMatrix()
  .then(() => {
    console.log("\n✨ Done!");
    process.exit(0);
  })
  .catch(error => {
    console.error("\n💥 Fatal error:", error);
    process.exit(1);
  });
