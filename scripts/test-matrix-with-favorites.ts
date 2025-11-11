import fs from "fs";
import path from "path";
import { config } from "dotenv";
import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage } from "@langchain/core/messages";
import stylesData from "../data/vinted/styles.json";
import brandsClassified from "../data/vinted/brands-classified.json";

config();

// Load favorite brands
const favoriteBrandsPath = path.join(process.cwd(), 'data/vinted/favorite-brands.txt');
const favoriteBrandsText = fs.readFileSync(favoriteBrandsPath, 'utf-8');
const favoriteBrands = favoriteBrandsText
  .split('\n')
  .map(line => line.trim())
  .filter(line => line.length > 0)
  .map(brand => brand.replace(/^["*]+|["*]+$/g, '').trim());

async function testWithFavorites() {
  console.log(`📋 Loaded ${favoriteBrands.length} favorite brands\n`);
  console.log("🧪 Testing AI generation with curated favorites for Avant-Garde aesthetic\n");

  const model = new ChatOpenAI({
    modelName: "gpt-4o",
    temperature: 0.7,
  });

  const style = stylesData.styles.find(s => s.id === "avantgarde");
  if (!style) {
    console.error("Style not found!");
    return;
  }

  const relevantBrands = brandsClassified.brandDatabase.filter(b =>
    b.category === "Trendy/Designer" &&
    style.brands.some(sb => sb.toLowerCase().includes(b.brand.toLowerCase()))
  );

  const prompt = `You are a fashion expert specializing in brand analysis and affordable alternatives.

AESTHETIC: ${style.name}
DESCRIPTION: ${style.description}

LUXURY BRANDS FOR THIS AESTHETIC:
${relevantBrands.map(b => `- ${b.brand} (vibe: ${b.vibeTags.join(", ")})`).join("\n")}

🎯 CURATED BRAND DATABASE (VERIFIED AVAILABLE ON VINTED):
You have access to ${favoriteBrands.length} brands that are CONFIRMED to exist on Vinted.
When suggesting affordable alternatives, YOU MUST ONLY use brands from this list:

${favoriteBrands.join(", ")}

YOUR TASK:
For each luxury brand above, provide 3-5 affordable alternatives from the CURATED DATABASE.

CRITICAL RULES:
- ALL alternatives MUST come from the curated list above
- Pick brands that genuinely match the luxury brand's aesthetic
- DO NOT invent brands

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

  console.log("🤖 Calling AI...\n");

  const message = new HumanMessage({ content: prompt });
  const response = await model.invoke([message]);
  const rawContent = response.content as string;

  const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    console.error("❌ AI did not return valid JSON");
    return;
  }

  const aiResult = JSON.parse(jsonMatch[0]);

  console.log("✅ AI Response:\n");
  console.log(JSON.stringify(aiResult, null, 2));

  console.log("\n📊 Verification:");
  aiResult.brands.forEach((brand: any) => {
    console.log(`\n${brand.name}:`);
    brand.alternatives.forEach((alt: any) => {
      const isInFavorites = favoriteBrands.some(
        fav => fav.toLowerCase() === alt.name.toLowerCase()
      );
      console.log(`  ${isInFavorites ? '✅' : '❌'} ${alt.name} (${alt.matchScore}% match)`);
    });
  });
}

testWithFavorites();
