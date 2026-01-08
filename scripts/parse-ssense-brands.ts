/**
 * Parse SSENSE API response and extract brand data
 *
 * Expected input files:
 * - data/ssense/women-brands-raw.json (from SSENSE women designers API)
 * - data/ssense/men-brands-raw.json (from SSENSE men designers API)
 *
 * Output:
 * - data/ssense/ssense-brands.json (combined, deduplicated list)
 *
 * Usage: npx tsx scripts/parse-ssense-brands.ts
 */

import fs from 'fs';
import path from 'path';

interface SSENSEDesigner {
  id: number;
  name: string;
  url: string; // Contains slug like "/en-hk/women/designers/rick-owens"
}

interface SSENSEAPIResponse {
  designers: SSENSEDesigner[];
  // API may include other fields
}

interface ParsedBrand {
  brand_name: string;
  ssense_slug: string;
  available_women: boolean;
  available_men: boolean;
}

function extractSlug(url: string): string {
  // URL format: "/en-hk/women/designers/rick-owens" or "/en-hk/men/designers/acne-studios"
  const parts = url.split('/');
  return parts[parts.length - 1]; // Get the last part (brand slug)
}

function normalizeBrandName(name: string): string {
  // Clean up brand name for consistent comparison
  return name
    .trim()
    .replace(/\s+/g, ' ') // Collapse multiple spaces
    .toUpperCase(); // For comparison
}

async function parseSSENSEBrands() {
  const dataDir = path.join(process.cwd(), 'data/ssense');

  // Ensure data directory exists
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
    console.log(`📁 Created directory: ${dataDir}`);
  }

  const womenFile = path.join(dataDir, 'women-brands-raw.json');
  const menFile = path.join(dataDir, 'men-brands-raw.json');

  // Brand map for deduplication (key: normalized name)
  const brandMap = new Map<string, ParsedBrand>();

  // Parse women brands
  if (fs.existsSync(womenFile)) {
    console.log(`\n📂 Parsing women brands from: ${womenFile}`);
    const womenData: SSENSEAPIResponse = JSON.parse(fs.readFileSync(womenFile, 'utf-8'));

    const designers = womenData.designers || [];
    console.log(`   Found ${designers.length} women designers`);

    for (const designer of designers) {
      const normalized = normalizeBrandName(designer.name);
      const slug = extractSlug(designer.url);

      if (brandMap.has(normalized)) {
        // Brand already exists, mark as available for women
        brandMap.get(normalized)!.available_women = true;
      } else {
        brandMap.set(normalized, {
          brand_name: designer.name.trim(),
          ssense_slug: slug,
          available_women: true,
          available_men: false,
        });
      }
    }
    console.log(`   ✅ Processed ${designers.length} women brands`);
  } else {
    console.log(`\n⚠️  Women brands file not found: ${womenFile}`);
    console.log(`   Save SSENSE women API response to this file first.`);
    console.log(`   API: https://www.ssense.com/en-hk/api/navigation/women/v2?`);
  }

  // Parse men brands
  if (fs.existsSync(menFile)) {
    console.log(`\n📂 Parsing men brands from: ${menFile}`);
    const menData: SSENSEAPIResponse = JSON.parse(fs.readFileSync(menFile, 'utf-8'));

    const designers = menData.designers || [];
    console.log(`   Found ${designers.length} men designers`);

    for (const designer of designers) {
      const normalized = normalizeBrandName(designer.name);
      const slug = extractSlug(designer.url);

      if (brandMap.has(normalized)) {
        // Brand already exists, mark as available for men
        brandMap.get(normalized)!.available_men = true;
      } else {
        brandMap.set(normalized, {
          brand_name: designer.name.trim(),
          ssense_slug: slug,
          available_women: false,
          available_men: true,
        });
      }
    }
    console.log(`   ✅ Processed ${designers.length} men brands`);
  } else {
    console.log(`\n⚠️  Men brands file not found: ${menFile}`);
    console.log(`   Save SSENSE men API response to this file first.`);
    console.log(`   API: https://www.ssense.com/en-hk/api/navigation/men/v2?`);
  }

  // Convert map to array and sort
  const allBrands = Array.from(brandMap.values())
    .sort((a, b) => a.brand_name.localeCompare(b.brand_name));

  // Statistics
  const womenOnly = allBrands.filter(b => b.available_women && !b.available_men);
  const menOnly = allBrands.filter(b => !b.available_women && b.available_men);
  const both = allBrands.filter(b => b.available_women && b.available_men);

  console.log('\n' + '═'.repeat(60));
  console.log('📊 PARSING SUMMARY');
  console.log('═'.repeat(60));
  console.log(`Total unique brands: ${allBrands.length}`);
  console.log(`├── Women only:      ${womenOnly.length}`);
  console.log(`├── Men only:        ${menOnly.length}`);
  console.log(`└── Both genders:    ${both.length} (overlapping)`);
  console.log('═'.repeat(60));

  // Show some examples of overlapping brands
  if (both.length > 0) {
    console.log('\n📌 Example overlapping brands:');
    both.slice(0, 10).forEach(b => {
      console.log(`   - ${b.brand_name}`);
    });
  }

  // Save output
  const outputFile = path.join(dataDir, 'ssense-brands.json');
  fs.writeFileSync(outputFile, JSON.stringify(allBrands, null, 2));
  console.log(`\n💾 Saved ${allBrands.length} brands to: ${outputFile}`);

  // Also save just brand names for vectorization
  const brandNamesFile = path.join(dataDir, 'ssense-brand-names.txt');
  const brandNames = allBrands.map(b => b.brand_name).join('\n');
  fs.writeFileSync(brandNamesFile, brandNames);
  console.log(`💾 Saved brand names to: ${brandNamesFile}`);

  // Save tier suggestions based on common knowledge
  const tierSuggestions = suggestTiers(allBrands);
  const tierFile = path.join(dataDir, 'ssense-tier-suggestions.json');
  fs.writeFileSync(tierFile, JSON.stringify(tierSuggestions, null, 2));
  console.log(`💾 Saved tier suggestions to: ${tierFile}`);

  console.log('\n✅ Parsing complete!');
  console.log('\n📋 Next steps:');
  console.log('1. Review ssense-brands.json');
  console.log('2. Run vectorization: npx tsx scripts/generate-ssense-vibe-matrix.ts');
  console.log('3. Run ingestion: npx tsx scripts/ingest-ssense-brands.ts');

  return allBrands;
}

// Suggest tier based on brand name (known luxury/designer brands)
function suggestTiers(brands: ParsedBrand[]): Record<string, string> {
  const ICON_BRANDS = new Set([
    'RICK OWENS', 'BALENCIAGA', 'COMME DES GARCONS', 'COMME DES GARÇONS',
    'RAF SIMONS', 'YOHJI YAMAMOTO', 'ISSEY MIYAKE', 'JIL SANDER',
    'MAISON MARGIELA', 'ANN DEMEULEMEESTER', 'DRIES VAN NOTEN', 'VETEMENTS'
  ].map(s => s.toUpperCase()));

  const LUXURY_BRANDS = new Set([
    'GUCCI', 'PRADA', 'SAINT LAURENT', 'BOTTEGA VENETA', 'LOEWE',
    'GIVENCHY', 'VALENTINO', 'VERSACE', 'FENDI', 'BURBERRY',
    'ALEXANDER MCQUEEN', 'TOM FORD', 'CELINE', 'CÉLINE', 'DIOR',
    'JACQUEMUS', 'THOM BROWNE', 'ACNE STUDIOS', 'LEMAIRE', 'THE ROW'
  ].map(s => s.toUpperCase()));

  const GEM_BRANDS = new Set([
    'MARINE SERRE', 'OTTOLINGER', 'OUR LEGACY', 'STUSSY', 'CARHARTT WIP',
    'A-COLD-WALL*', 'STONE ISLAND', '1017 ALYX 9SM', 'OFF-WHITE',
    'SACAI', 'UNDERCOVER', 'NEEDLES', 'VISVIM', 'KAPITAL',
    'SIMONE ROCHA', 'CECILIE BAHNSEN', 'KENZO', 'MM6 MAISON MARGIELA'
  ].map(s => s.toUpperCase()));

  const suggestions: Record<string, string> = {};

  for (const brand of brands) {
    const normalized = brand.brand_name.toUpperCase();

    if (ICON_BRANDS.has(normalized)) {
      suggestions[brand.brand_name] = 'icon';
    } else if (LUXURY_BRANDS.has(normalized)) {
      suggestions[brand.brand_name] = 'luxury';
    } else if (GEM_BRANDS.has(normalized)) {
      suggestions[brand.brand_name] = 'gem';
    } else {
      // Default: SSENSE brands are at least "affordable" tier (curated retailer)
      suggestions[brand.brand_name] = 'affordable';
    }
  }

  return suggestions;
}

// Run
parseSSENSEBrands().catch(console.error);
