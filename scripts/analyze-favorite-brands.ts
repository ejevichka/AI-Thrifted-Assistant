import fs from 'fs';
import path from 'path';
import brandsClassified from '../data/vinted/brands-classified.json';
import aestheticMatrix from '../data/vinted/aesthetic-brand-matrix.json';

/**
 * Analyze user's favorite brands and create personalized recommendations
 */

function analyzeFavoriteBrands() {
  console.log('🎨 Analyzing your curated favorite brands...\n');

  // Read favorite brands
  const favoritesPath = path.join(process.cwd(), 'data/vinted/favorite-brands.txt');
  const favoritesText = fs.readFileSync(favoritesPath, 'utf-8');

  // Parse brands (remove quotes, asterisks, etc.)
  const favoriteBrands = favoritesText
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .map(brand => brand.replace(/^["*]+|["*]+$/g, '').trim());

  console.log(`✓ Found ${favoriteBrands.length} favorite brands\n`);

  // 1. Check which favorites are in our classified database
  const favoritesInDatabase: any[] = [];
  const favoritesNotInDatabase: string[] = [];

  favoriteBrands.forEach(fav => {
    const found = brandsClassified.brandDatabase.find(
      b => b.brand.toLowerCase() === fav.toLowerCase()
    );
    if (found) {
      favoritesInDatabase.push(found);
    } else {
      favoritesNotInDatabase.push(fav);
    }
  });

  console.log('📊 DATABASE ANALYSIS:');
  console.log(`   ✓ In database: ${favoritesInDatabase.length}`);
  console.log(`   ✗ Not in database: ${favoritesNotInDatabase.length}`);

  // 2. Analyze vibe tags from favorites
  const vibeTagCounts: Record<string, number> = {};
  favoritesInDatabase.forEach(brand => {
    brand.vibeTags.forEach((tag: string) => {
      vibeTagCounts[tag] = (vibeTagCounts[tag] || 0) + 1;
    });
  });

  const topVibeTags = Object.entries(vibeTagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  console.log('\n🏷️  YOUR TOP VIBE TAGS:');
  topVibeTags.forEach(([tag, count]) => {
    console.log(`   ${tag}: ${count} brands`);
  });

  // 3. Check which favorites appear in aesthetic matrix
  const favoritesInMatrix: any[] = [];
  const matrices = (aestheticMatrix as any).matrices || [];

  favoriteBrands.forEach(fav => {
    matrices.forEach((matrix: any) => {
      // Check luxury brands
      matrix.luxuryBrands.forEach((luxBrand: any) => {
        if (luxBrand.name.toLowerCase() === fav.toLowerCase()) {
          favoritesInMatrix.push({
            brand: fav,
            aesthetic: matrix.aesthetic,
            type: 'luxury'
          });
        }
        // Check affordable alternatives
        luxBrand.affordableAlternatives.forEach((alt: any) => {
          if (alt.name.toLowerCase() === fav.toLowerCase()) {
            favoritesInMatrix.push({
              brand: fav,
              aesthetic: matrix.aesthetic,
              type: 'affordable',
              matchesLuxury: luxBrand.name
            });
          }
        });
      });
    });
  });

  console.log(`\n✨ FAVORITES IN AESTHETIC MATRIX: ${favoritesInMatrix.length}`);

  // Group by aesthetic
  const aestheticGroups: Record<string, any[]> = {};
  favoritesInMatrix.forEach(item => {
    if (!aestheticGroups[item.aesthetic]) {
      aestheticGroups[item.aesthetic] = [];
    }
    aestheticGroups[item.aesthetic].push(item);
  });

  Object.entries(aestheticGroups).forEach(([aesthetic, brands]) => {
    console.log(`\n   ${aesthetic}:`);
    brands.forEach(b => {
      if (b.type === 'affordable') {
        console.log(`      ${b.brand} → matches ${b.matchesLuxury}`);
      } else {
        console.log(`      ${b.brand} (luxury)`);
      }
    });
  });

  // 4. Identify aesthetic preferences
  const aestheticCounts: Record<string, number> = {};
  favoritesInMatrix.forEach(item => {
    aestheticCounts[item.aesthetic] = (aestheticCounts[item.aesthetic] || 0) + 1;
  });

  const topAesthetics = Object.entries(aestheticCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  console.log('\n🎭 YOUR TOP AESTHETICS (based on favorites):');
  topAesthetics.forEach(([aesthetic, count]) => {
    console.log(`   ${aesthetic}: ${count} brands`);
  });

  // 5. Generate personalized brand recommendations
  console.log('\n💎 PERSONALIZED RECOMMENDATIONS:');
  console.log('   (Brands similar to your favorites that you might not have saved yet)\n');

  topAesthetics.slice(0, 3).forEach(([aesthetic, _]) => {
    const matrix = matrices.find((m: any) => m.aesthetic === aesthetic);
    if (matrix) {
      console.log(`   ${aesthetic}:`);

      // Get all brands from this aesthetic
      const allBrandsInAesthetic: string[] = [];
      matrix.luxuryBrands.forEach((luxBrand: any) => {
        allBrandsInAesthetic.push(luxBrand.name);
        luxBrand.affordableAlternatives.forEach((alt: any) => {
          allBrandsInAesthetic.push(alt.name);
        });
      });

      // Filter out brands already in favorites
      const newRecommendations = allBrandsInAesthetic.filter(
        brand => !favoriteBrands.some(fav => fav.toLowerCase() === brand.toLowerCase())
      );

      newRecommendations.slice(0, 5).forEach(brand => {
        console.log(`      → ${brand}`);
      });
      console.log('');
    }
  });

  // 6. Create personalized search profile
  const profile = {
    totalFavorites: favoriteBrands.length,
    inDatabase: favoritesInDatabase.length,
    topVibeTags: topVibeTags.map(([tag, count]) => ({ tag, count })),
    topAesthetics: topAesthetics.map(([aesthetic, count]) => ({ aesthetic, count })),
    favoritesInMatrix: favoritesInMatrix.length,
    notInDatabase: favoritesNotInDatabase.slice(0, 20), // First 20 missing brands
  };

  // Save profile
  const outputPath = path.join(process.cwd(), 'data/vinted/user-profile.json');
  fs.writeFileSync(outputPath, JSON.stringify(profile, null, 2));

  console.log(`\n✅ User profile saved to: ${outputPath}`);

  return profile;
}

// Run analysis
analyzeFavoriteBrands();
