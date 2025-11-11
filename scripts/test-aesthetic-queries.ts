import { aestheticMatcher } from "../app/services/aesthetic-matcher";
import stylesData from "../data/vinted/styles.json";

/**
 * Test script to show what queries are generated for each aesthetic
 */

console.log("🎨 Testing AI Aesthetic Matrix Query Generation\n");
console.log("=" .repeat(80));

// Test a few key aesthetics
const testAesthetics = [
  "Gorpcore",
  "Y2K",
  "Avant-Garde",
  "Streetwear",
  "Dark Romance"
];

testAesthetics.forEach(aesthetic => {
  console.log(`\n📍 ${aesthetic.toUpperCase()}`);
  console.log("-".repeat(80));

  // Get AI-generated queries
  const aiQueries = aestheticMatcher.generateSearchQueries(aesthetic, {
    includeAlternatives: true,
    maxQueries: 10
  });

  if (aiQueries.length > 0) {
    console.log(`✓ Generated ${aiQueries.length} AI queries:`);
    aiQueries.forEach((query, i) => {
      console.log(`   ${i + 1}. "${query}"`);
    });
  } else {
    console.log("⚠️  No AI queries found");
  }

  // Compare with original hashtags
  const styleData = stylesData.styles.find(s =>
    s.name.toLowerCase() === aesthetic.toLowerCase()
  );

  if (styleData) {
    console.log(`\n   Original hashtags (old approach):`);
    styleData.hashtags.slice(0, 3).forEach((tag, i) => {
      console.log(`   ${i + 1}. "${tag}"`);
    });
  }
});

console.log("\n" + "=".repeat(80));
console.log("✅ Test complete!");
console.log("\n💡 The AI queries use actual brand names and search terms,");
console.log("   which should give MUCH better results than hashtags!\n");
