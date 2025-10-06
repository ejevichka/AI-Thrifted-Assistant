/**
 * Brand Matcher Testing Script
 *
 * Demonstrates the brand vibe-alike matching system
 *
 * Usage:
 *   ts-node --project tsconfig.scripts.json scripts/test-brand-matcher.ts
 */

import { brandMatcher } from '../app/api/vinted/chat/brand-matcher';

console.log('\n=== BRAND VIBE-ALIKE MATCHING SYSTEM TEST ===\n');

// Test 1: Find vibe-alikes for KNWLS
console.log('TEST 1: Find affordable alternatives to KNWLS\n');
console.log('User searches: "KNWLS jacket"\n');

const knwlsBrand = brandMatcher.findBrand('KNWLS');
if (knwlsBrand) {
  console.log('Brand Found:');
  console.log(`  Name: ${knwlsBrand.brand}`);
  console.log(`  Category: ${knwlsBrand.category}`);
  console.log(`  Vibe Tags: ${knwlsBrand.vibeTags.join(', ')}`);
  console.log(`  Price Range: ${knwlsBrand.priceRange}`);
  console.log();

  const vibeAlikes = brandMatcher.findVibeAlikeBrands('KNWLS', { limit: 5 });
  console.log('Vibe-Alike Alternatives:');
  vibeAlikes.forEach((match, index) => {
    console.log(`  ${index + 1}. ${match.brand} (${match.category})`);
    console.log(`     Match Score: ${(match.matchScore * 100).toFixed(0)}%`);
    console.log(`     Shared Tags: ${match.sharedTags.join(', ')}`);
    console.log(`     Price Range: ${match.priceRange}`);
    console.log();
  });

  const searchQueries = brandMatcher.generateAugmentedSearchQueries('KNWLS', 'jacket', 3);
  console.log('Generated Search Queries:');
  searchQueries.forEach((query, index) => {
    console.log(`  ${index + 1}. "${query}"`);
  });
  console.log();
}

console.log('='.repeat(70));
console.log();

// Test 2: Find brands by vibe tags
console.log('TEST 2: Find all Y2K + French Chic brands\n');
console.log('User asks: "Show me Y2K French brands"\n');

const y2kFrenchBrands = brandMatcher.findBrandsByVibeTags(
  ['y2k', 'french_chic'],
  { limit: 8, category: 'all' }
);

console.log('Matching Brands:');
y2kFrenchBrands.forEach((match, index) => {
  console.log(`  ${index + 1}. ${match.brand} (${match.category})`);
  console.log(`     Match Score: ${(match.matchScore * 100).toFixed(0)}%`);
  console.log(`     Shared Tags: ${match.sharedTags.join(', ')}`);
  console.log();
});

console.log('='.repeat(70));
console.log();

// Test 3: Find gorpcore brands
console.log('TEST 3: Find Gorpcore brands\n');
console.log('User asks: "I want gorpcore style"\n');

const gorpcoreBrands = brandMatcher.findBrandsByVibeTags(
  ['gorpcore'],
  { limit: 6, category: 'all' }
);

console.log('Gorpcore Brands:');
const trendyGorpcore = gorpcoreBrands.filter(b => b.category === 'Trendy/Designer');
const affordableGorpcore = gorpcoreBrands.filter(b => b.category === 'Vintage/Affordable');

console.log('\n  Trendy/Designer:');
trendyGorpcore.forEach(brand => {
  console.log(`    - ${brand.brand} (${brand.priceRange})`);
});

console.log('\n  Vintage/Affordable:');
affordableGorpcore.forEach(brand => {
  console.log(`    - ${brand.brand} (${brand.priceRange})`);
});
console.log();

console.log('='.repeat(70));
console.log();

// Test 4: Multiple brand recommendation
console.log('TEST 4: Recommend brands based on multiple inputs\n');
console.log('User likes: KNWLS, Mugler, and Marine Serre\n');

const multiRecommendations = brandMatcher.recommendBrandsFromMultiple(
  ['KNWLS', 'Mugler', 'Marine Serre'],
  { limit: 5, category: 'Vintage/Affordable' }
);

console.log('Based on those brands, we recommend these affordable alternatives:');
multiRecommendations.forEach((match, index) => {
  console.log(`  ${index + 1}. ${match.brand}`);
  console.log(`     Match Score: ${(match.matchScore * 100).toFixed(0)}%`);
  console.log(`     Shared Vibe: ${match.sharedTags.join(', ')}`);
  console.log(`     Price: ${match.priceRange}`);
  console.log();
});

console.log('='.repeat(70));
console.log();

// Test 5: All vibe tags in use
console.log('TEST 5: Most popular vibe tags\n');

const allTags = brandMatcher.getAllUsedVibeTags();
console.log('Top 10 Most Used Vibe Tags:');
allTags.slice(0, 10).forEach((tagInfo, index) => {
  console.log(`  ${index + 1}. ${tagInfo.tag} (used ${tagInfo.count} times)`);
});
console.log();

console.log('='.repeat(70));
console.log();

// Test 6: Extract brands from natural language query
console.log('TEST 6: Extract brands from user query\n');

const testQueries = [
  "I'm looking for KNWLS style but cheaper",
  "Find me Acne Studios or similar minimalist brands",
  "Show me Diesel and Stüssy jackets"
];

testQueries.forEach(query => {
  console.log(`Query: "${query}"`);
  const extracted = brandMatcher.extractBrandsFromQuery(query);
  console.log(`Extracted brands: ${extracted.join(', ') || 'none'}`);
  console.log();
});

console.log('='.repeat(70));
console.log();

console.log('✅ All tests completed!\n');
console.log('To use the brand matcher in your app:');
console.log('  1. Chat with DIGGY and mention a designer brand');
console.log('  2. Try: "Find me KNWLS style jacket"');
console.log('  3. Try: "Show me Y2K French brands"');
console.log('  4. Try: "I want gorpcore aesthetic"');
console.log();
console.log('API Endpoints:');
console.log('  GET  /api/vinted/brand-match?brand=KNWLS');
console.log('  POST /api/vinted/brand-match');
console.log('       Body: { "vibeTags": ["y2k", "moto_glam"] }');
console.log();
