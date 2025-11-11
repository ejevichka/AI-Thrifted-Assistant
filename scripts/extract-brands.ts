const fs = require('fs');
const path = require('path');

// Configuration
const INPUT_FILE = path.join(__dirname, '..', 'data', 'vinted', 'favorites-list.txt');
const OUTPUT_FILE = path.join(__dirname, '..', 'data', 'vinted', 'favorite-brands.txt');

function extractBrands(): void {
  console.log('📖 Reading favorites list...\n');

  // Read the file
  const content = fs.readFileSync(INPUT_FILE, 'utf-8');
  const lines = content.split('\n').filter((line: string) => line.trim());

  console.log(`Found ${lines.length} items\n`);

  // Extract brands (everything after the last " - ")
  const brands = new Set<string>();

  lines.forEach((line: string) => {
    const lastDashIndex = line.lastIndexOf(' - ');
    if (lastDashIndex !== -1) {
      const brand = line.substring(lastDashIndex + 3).trim();
      if (brand) {
        brands.add(brand);
      }
    }
  });

  // Sort brands alphabetically
  const sortedBrands = Array.from(brands).sort((a, b) =>
    a.toLowerCase().localeCompare(b.toLowerCase())
  );

  // Save to file
  fs.writeFileSync(OUTPUT_FILE, sortedBrands.join('\n'), 'utf-8');

  console.log(`✅ Extracted ${sortedBrands.length} unique brands\n`);
  console.log(`📝 Saved to: ${OUTPUT_FILE}\n`);

  // Show first 20 brands as preview
  console.log('First 20 brands:');
  sortedBrands.slice(0, 20).forEach((brand, index) => {
    console.log(`${index + 1}. ${brand}`);
  });

  if (sortedBrands.length > 20) {
    console.log(`... and ${sortedBrands.length - 20} more`);
  }
}

// Run the extraction
try {
  extractBrands();
} catch (error) {
  console.error('❌ Error:', error);
  process.exit(1);
}
