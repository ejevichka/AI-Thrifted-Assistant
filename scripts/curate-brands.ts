/**
 * Brand Curation Script
 *
 * This script helps you classify new brands with:
 * - Category (Trendy/Designer or Vintage/Affordable)
 * - Vibe Tags (aesthetic descriptors)
 * - Price Range
 * - Search Priority
 *
 * Usage:
 *   ts-node --project tsconfig.scripts.json scripts/curate-brands.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

// Import existing data
const brandsClassifiedPath = path.join(__dirname, '../data/vinted/brands-classified.json');
const vibeTagsPath = path.join(__dirname, '../data/vinted/vibe-tags.json');

interface BrandEntry {
  brand: string;
  category: 'Trendy/Designer' | 'Vintage/Affordable';
  vibeTags: string[];
  priceRange: 'low' | 'low-medium' | 'medium' | 'medium-high' | 'high' | 'luxury';
  searchPriority: number;
  matchesTrendy?: string[];
}

// Load existing data
let existingData: { brandDatabase: BrandEntry[] } = { brandDatabase: [] };
if (fs.existsSync(brandsClassifiedPath)) {
  existingData = JSON.parse(fs.readFileSync(brandsClassifiedPath, 'utf-8'));
}

const vibeTagsData = JSON.parse(fs.readFileSync(vibeTagsPath, 'utf-8'));

// Extract all available vibe tags
const getAllVibeTags = (): string[] => {
  const allTags: string[] = [];
  const vocabulary = vibeTagsData.vibeTagVocabulary;

  for (const category of Object.values(vocabulary) as any[]) {
    allTags.push(...Object.keys(category));
  }

  return allTags.sort();
};

const allAvailableTags = getAllVibeTags();

// Display vibe tag categories
const displayVibeTagCategories = () => {
  console.log('\n=== VIBE TAG VOCABULARY ===\n');
  const vocabulary = vibeTagsData.vibeTagVocabulary;

  console.log('CORE AESTHETICS:');
  console.log(Object.keys(vocabulary.core_aesthetics).join(', '));

  console.log('\nERA-SPECIFIC:');
  console.log(Object.keys(vocabulary.era_specific).join(', '));

  console.log('\nMICRO-TRENDS:');
  console.log(Object.keys(vocabulary.micro_trends).join(', '));

  console.log('\nORIGIN/STYLE:');
  console.log(Object.keys(vocabulary.origin_style).join(', '));

  console.log('\nBASICS:');
  console.log(Object.keys(vocabulary.basics).join(', '));

  console.log('\n');
};

// Interactive CLI
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (prompt: string): Promise<string> => {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
};

// Main curation function
const curateBrand = async () => {
  console.log('\n=== BRAND CURATION TOOL ===\n');

  displayVibeTagCategories();

  const brandName = await question('Enter brand name (or "exit" to quit): ');

  if (brandName.toLowerCase() === 'exit') {
    console.log('Exiting...');
    rl.close();
    return;
  }

  // Check if brand already exists
  const existingBrand = existingData.brandDatabase.find(
    b => b.brand.toLowerCase() === brandName.toLowerCase()
  );

  if (existingBrand) {
    console.log(`\n⚠️  Brand "${brandName}" already exists:`);
    console.log(JSON.stringify(existingBrand, null, 2));
    const overwrite = await question('Do you want to overwrite it? (yes/no): ');
    if (overwrite.toLowerCase() !== 'yes') {
      await curateBrand();
      return;
    }
  }

  // Category
  console.log('\nCategories:');
  console.log('1. Trendy/Designer (High-end, current brands)');
  console.log('2. Vintage/Affordable (Second-hand, affordable brands)');
  const categoryChoice = await question('Select category (1 or 2): ');
  const category = categoryChoice === '1' ? 'Trendy/Designer' : 'Vintage/Affordable';

  // Price Range
  console.log('\nPrice Ranges:');
  console.log('1. low');
  console.log('2. low-medium');
  console.log('3. medium');
  console.log('4. medium-high');
  console.log('5. high');
  console.log('6. luxury');
  const priceChoice = await question('Select price range (1-6): ');
  const priceRanges = ['low', 'low-medium', 'medium', 'medium-high', 'high', 'luxury'];
  const priceRange = priceRanges[parseInt(priceChoice) - 1] as any || 'medium';

  // Vibe Tags
  console.log('\nEnter vibe tags (comma-separated):');
  console.log('Example: y2k, french_chic, coquette');
  const vibeTagsInput = await question('Vibe tags: ');
  const vibeTags = vibeTagsInput.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);

  // Validate vibe tags
  const invalidTags = vibeTags.filter(tag => !allAvailableTags.includes(tag));
  if (invalidTags.length > 0) {
    console.log(`\n⚠️  Invalid tags: ${invalidTags.join(', ')}`);
    console.log('Please use only tags from the vocabulary above.');
    await curateBrand();
    return;
  }

  // Search Priority
  const priorityInput = await question('Search priority (1-5, default 3): ');
  const searchPriority = parseInt(priorityInput) || 3;

  // For Vintage/Affordable brands, ask for trendy matches
  let matchesTrendy: string[] | undefined = undefined;
  if (category === 'Vintage/Affordable') {
    console.log('\nOptional: Enter trendy/designer brands this matches (comma-separated):');
    const matchesInput = await question('Matches: ');
    if (matchesInput.trim()) {
      matchesTrendy = matchesInput.split(',').map(m => m.trim()).filter(m => m.length > 0);
    }
  }

  // Create brand entry
  const newBrand: BrandEntry = {
    brand: brandName,
    category,
    vibeTags,
    priceRange,
    searchPriority,
    ...(matchesTrendy && { matchesTrendy })
  };

  // Display preview
  console.log('\n=== BRAND PREVIEW ===');
  console.log(JSON.stringify(newBrand, null, 2));

  const confirm = await question('\nSave this brand? (yes/no): ');

  if (confirm.toLowerCase() === 'yes') {
    // Add or update brand
    if (existingBrand) {
      const index = existingData.brandDatabase.findIndex(
        b => b.brand.toLowerCase() === brandName.toLowerCase()
      );
      existingData.brandDatabase[index] = newBrand;
    } else {
      existingData.brandDatabase.push(newBrand);
    }

    // Sort by brand name
    existingData.brandDatabase.sort((a, b) => a.brand.localeCompare(b.brand));

    // Save to file
    fs.writeFileSync(
      brandsClassifiedPath,
      JSON.stringify(existingData, null, 2),
      'utf-8'
    );

    console.log(`\n✅ Brand "${brandName}" saved successfully!`);
    console.log(`Total brands in database: ${existingData.brandDatabase.length}`);
  }

  // Continue or exit
  const continueChoice = await question('\nAdd another brand? (yes/no): ');
  if (continueChoice.toLowerCase() === 'yes') {
    await curateBrand();
  } else {
    console.log('\n👋 Goodbye!');
    rl.close();
  }
};

// Batch import function
const batchImport = async () => {
  console.log('\n=== BATCH IMPORT ===\n');
  console.log('Paste your brands in JSON format (array of objects):');
  console.log('Example:');
  console.log('[');
  console.log('  { "brand": "Zara", "category": "Vintage/Affordable", "vibeTags": ["minimalist", "basics"], "priceRange": "low", "searchPriority": 3 }');
  console.log(']');
  console.log('\nPaste JSON and press Enter twice when done:\n');

  let jsonInput = '';
  const collectInput = async (): Promise<void> => {
    const line = await question('');
    if (line === '') {
      return;
    }
    jsonInput += line + '\n';
    await collectInput();
  };

  await collectInput();

  try {
    const brands: BrandEntry[] = JSON.parse(jsonInput);

    console.log(`\n📦 Importing ${brands.length} brands...`);

    for (const brand of brands) {
      // Validate
      if (!brand.brand || !brand.category || !brand.vibeTags || !brand.priceRange) {
        console.log(`⚠️  Skipping invalid brand: ${JSON.stringify(brand)}`);
        continue;
      }

      // Check if exists
      const existingIndex = existingData.brandDatabase.findIndex(
        b => b.brand.toLowerCase() === brand.brand.toLowerCase()
      );

      if (existingIndex >= 0) {
        console.log(`🔄 Updating: ${brand.brand}`);
        existingData.brandDatabase[existingIndex] = brand;
      } else {
        console.log(`➕ Adding: ${brand.brand}`);
        existingData.brandDatabase.push(brand);
      }
    }

    // Sort and save
    existingData.brandDatabase.sort((a, b) => a.brand.localeCompare(b.brand));
    fs.writeFileSync(
      brandsClassifiedPath,
      JSON.stringify(existingData, null, 2),
      'utf-8'
    );

    console.log(`\n✅ Batch import complete!`);
    console.log(`Total brands: ${existingData.brandDatabase.length}`);

  } catch (error) {
    console.error('❌ Error parsing JSON:', error);
  }

  rl.close();
};

// Main menu
const main = async () => {
  console.log('\n=== BRAND CURATION TOOL ===\n');
  console.log('1. Add/Edit brands interactively');
  console.log('2. Batch import from JSON');
  console.log('3. View all brands');
  console.log('4. Search brand');
  console.log('5. Exit');

  const choice = await question('\nSelect option (1-5): ');

  switch (choice) {
    case '1':
      await curateBrand();
      break;
    case '2':
      await batchImport();
      break;
    case '3':
      console.log('\n=== ALL BRANDS ===\n');
      console.log(JSON.stringify(existingData.brandDatabase, null, 2));
      rl.close();
      break;
    case '4':
      const searchTerm = await question('Enter brand name to search: ');
      const found = existingData.brandDatabase.filter(
        b => b.brand.toLowerCase().includes(searchTerm.toLowerCase())
      );
      console.log(`\nFound ${found.length} brands:`);
      console.log(JSON.stringify(found, null, 2));
      rl.close();
      break;
    case '5':
      console.log('👋 Goodbye!');
      rl.close();
      break;
    default:
      console.log('Invalid choice');
      await main();
  }
};

// Run
main();
