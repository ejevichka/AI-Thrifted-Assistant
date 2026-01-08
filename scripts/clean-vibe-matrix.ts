/**
 * Clean VibeDNA Matrix: Remove brands with all-zero affinities
 *
 * These brands are useless for style matching and bloat the database.
 *
 * Usage: npx tsx scripts/clean-vibe-matrix.ts
 */

import fs from 'fs';
import path from 'path';

interface VibeScores {
  casual: number;
  formal: number;
  sporty: number;
  vintage: number;
  bohemian: number;
  y2k: number;
  grunge: number;
  goth: number;
  techwear: number;
  gorpcore: number;
  academia: number;
  avantgarde: number;
  streetwear: number;
  cottagecore: number;
  clubkid: number;
  balletcore: number;
  kfashion: number;
  harajuku: number;
  minimaljapan: number;
  deconstructed: number;
  eclecticgrandpa: number;
  mobwife: number;
  blokecore: number;
  officesiren: number;
}

type BrandVibeMatrix = Record<string, VibeScores>;

function hasNonZeroAffinity(scores: VibeScores): boolean {
  return Object.values(scores).some(v => v > 0);
}

function cleanMatrix(inputPath: string, outputPath: string): void {
  console.log(`📂 Reading: ${inputPath}`);

  const raw = fs.readFileSync(inputPath, 'utf-8');
  const matrix: BrandVibeMatrix = JSON.parse(raw);

  const totalBrands = Object.keys(matrix).length;
  console.log(`📊 Total brands: ${totalBrands}`);

  // Filter out zero-affinity brands
  const cleanedMatrix: BrandVibeMatrix = {};
  const removedBrands: string[] = [];

  for (const [brandName, scores] of Object.entries(matrix)) {
    if (hasNonZeroAffinity(scores)) {
      cleanedMatrix[brandName] = scores;
    } else {
      removedBrands.push(brandName);
    }
  }

  const keptBrands = Object.keys(cleanedMatrix).length;
  console.log(`✅ Kept brands: ${keptBrands}`);
  console.log(`❌ Removed brands: ${removedBrands.length} (${((removedBrands.length / totalBrands) * 100).toFixed(1)}%)`);

  // Save cleaned matrix
  fs.writeFileSync(outputPath, JSON.stringify(cleanedMatrix, null, 2));
  console.log(`💾 Saved cleaned matrix to: ${outputPath}`);

  // Save removed brands list for reference
  const removedPath = outputPath.replace('.json', '-removed.json');
  fs.writeFileSync(removedPath, JSON.stringify(removedBrands, null, 2));
  console.log(`📝 Saved removed brands list to: ${removedPath}`);

  // Show some stats about kept brands
  const avgScores: Record<string, number> = {};
  for (const styleId of Object.keys(Object.values(cleanedMatrix)[0])) {
    const sum = Object.values(cleanedMatrix).reduce((acc, scores) => acc + (scores as any)[styleId], 0);
    avgScores[styleId] = sum / keptBrands;
  }

  console.log('\n📈 Average scores by style (cleaned matrix):');
  const sortedStyles = Object.entries(avgScores)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10);

  for (const [style, avg] of sortedStyles) {
    console.log(`   ${style}: ${avg.toFixed(3)}`);
  }
}

// Clean both sample and full matrix
const dataDir = path.join(process.cwd(), 'data/vinted');

console.log('🧹 Cleaning VibeDNA Matrix\n');
console.log('=' .repeat(50));

// Clean full matrix
const fullInput = path.join(dataDir, 'brand-vibe-matrix.json');
const fullOutput = path.join(dataDir, 'brand-vibe-matrix-cleaned.json');

if (fs.existsSync(fullInput)) {
  cleanMatrix(fullInput, fullOutput);
} else {
  console.log(`⚠️  Full matrix not found: ${fullInput}`);
}

console.log('\n' + '=' .repeat(50));

// Clean sample matrix
const sampleInput = path.join(dataDir, 'brand-vibe-matrix-sample.json');
const sampleOutput = path.join(dataDir, 'brand-vibe-matrix-sample-cleaned.json');

if (fs.existsSync(sampleInput)) {
  cleanMatrix(sampleInput, sampleOutput);
} else {
  console.log(`⚠️  Sample matrix not found: ${sampleInput}`);
}

console.log('\n' + '=' .repeat(50));
console.log('\n✨ Done! Next steps:');
console.log('1. Review the cleaned files');
console.log('2. Replace original files with cleaned versions:');
console.log('   mv data/vinted/brand-vibe-matrix-cleaned.json data/vinted/brand-vibe-matrix.json');
console.log('3. Re-ingest to Supabase:');
console.log('   npx tsx scripts/ingest-vibe-matrix.ts');
console.log('4. Or delete zero-affinity brands from DB directly:');
console.log(`   DELETE FROM vibe_entities WHERE entity_type = 'brand' AND vibe_vector = '[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]'::vector;`);
