// ==========================================
// TIER_BOOST System - Ready to Copy
// ==========================================
// Добавь этот код в app/api/vinted/search-external/route.ts
// После imports (строка ~16), перед buildVintedUrl function
// ==========================================

// ✨ Configuration: Boost multipliers per tier
const TIER_BOOST_MULTIPLIERS = {
  icon: 2.5,      // 🥇 Highest priority - Aesthetic icons (Rick Owens, Balenciaga)
  luxury: 2.0,    // 💎 High-end brands (Giuseppe Zanotti, Ferragamo)
  gem: 1.5,       // 💍 Hidden gems for diggers (Cop Copine, Save the Queen!)
  affordable: 1.0, // 💰 Good basics (COS, Arket)
  mainstream: 0.7  // 🏪 Lower priority (Esprit, ASOS, H&M)
};

// Global cache для brand metadata (загружается один раз)
let brandMetadataCache: Map<string, { tier: string; avg_price: string; context_tags: string[] }> | null = null;

// ==========================================
// Load brand metadata from Supabase (cached)
// ==========================================
async function loadBrandMetadata(): Promise<Map<string, { tier: string; avg_price: string; context_tags: string[] }>> {
  // Return cached data if available
  if (brandMetadataCache) {
    console.log('✅ Using cached brand metadata');
    return brandMetadataCache;
  }

  console.log('📥 Loading brand metadata from Supabase...');
  const startTime = Date.now();

  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data, error } = await supabase
      .from('vibe_entities')
      .select('entity_name, metadata')
      .eq('entity_type', 'brand')
      .not('metadata->>tier', 'is', null);

    if (error) {
      console.error('❌ Failed to load brand metadata:', error);
      return new Map();
    }

    const cache = new Map<string, { tier: string; avg_price: string; context_tags: string[] }>();

    data?.forEach((brand: any) => {
      if (brand.metadata?.tier) {
        // Normalize brand name: lowercase, trim, remove special chars
        const normalizedName = brand.entity_name
          .toLowerCase()
          .trim()
          .replace(/[^\w\s]/g, ''); // Remove special characters for better matching

        cache.set(normalizedName, {
          tier: brand.metadata.tier,
          avg_price: brand.metadata.avg_price || 'mid',
          context_tags: brand.metadata.context_tags || []
        });

        // Also add original name for exact matches
        cache.set(brand.entity_name.toLowerCase().trim(), {
          tier: brand.metadata.tier,
          avg_price: brand.metadata.avg_price || 'mid',
          context_tags: brand.metadata.context_tags || []
        });
      }
    });

    console.log(`✅ Loaded ${cache.size / 2} brands with tier metadata in ${Date.now() - startTime}ms`);
    brandMetadataCache = cache;
    return cache;

  } catch (error) {
    console.error('❌ Exception loading brand metadata:', error);
    return new Map();
  }
}

// ==========================================
// Apply TIER_BOOST to products
// ==========================================
async function applyTierBoost(products: ScrapedItem[]): Promise<ScrapedItem[]> {
  if (products.length === 0) {
    return products;
  }

  const startTime = Date.now();
  console.log(`🎯 Applying TIER_BOOST to ${products.length} products...`);

  const brandMetadata = await loadBrandMetadata();

  if (brandMetadata.size === 0) {
    console.warn('⚠️  No brand metadata loaded, skipping TIER_BOOST');
    return products;
  }

  // Helper: Normalize brand name for matching
  const normalizeBrand = (brand: string) => {
    return brand
      .toLowerCase()
      .trim()
      .replace(/[^\w\s]/g, '');
  };

  // Calculate diggyScore for each product
  const productsWithScore = products.map((product, index) => {
    const normalizedBrand = normalizeBrand(product.brand);
    const metadata = brandMetadata.get(normalizedBrand);
    const tier = metadata?.tier || 'mainstream'; // Default to mainstream if unknown

    // Get boost multiplier
    const boost = TIER_BOOST_MULTIPLIERS[tier as keyof typeof TIER_BOOST_MULTIPLIERS] || 1.0;

    // Calculate diggyScore = (position penalty) * (tier boost)
    // Position penalty: items later in list get lower base score
    const positionScore = Math.max(0, 1000 - index);
    const diggyScore = positionScore * boost;

    return {
      ...product,
      _metadata: {
        tier,
        boost,
        diggyScore,
        originalPosition: index,
        avg_price: metadata?.avg_price,
        context_tags: metadata?.context_tags
      }
    };
  });

  // Sort by diggyScore DESC (highest first)
  const sortedProducts = productsWithScore.sort((a, b) => b._metadata.diggyScore - a._metadata.diggyScore);

  // Calculate tier distribution for logging
  const tierCounts = sortedProducts.reduce((acc, p) => {
    const tier = p._metadata.tier;
    acc[tier] = (acc[tier] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const duration = Date.now() - startTime;
  console.log('🎯 TIER_BOOST complete:');
  console.log(`   Duration: ${duration}ms`);
  console.log('   Distribution:', JSON.stringify(tierCounts));
  console.log(`   Top 5 brands: ${sortedProducts.slice(0, 5).map(p => `${p.brand} (${p._metadata.tier})`).join(', ')}`);

  return sortedProducts;
}

// ==========================================
// HOW TO USE (in POST handler):
// ==========================================
/*

// Step 1: Find this line (around line 341):
let uniqueProducts = Array.from(new Map(allProducts.map(item => [item.id, item])).values());

console.log(`Found ${uniqueProducts.length} unique products before filtering`);

// Step 2: Add this line AFTER deduplicate, BEFORE AI-Ranker:
uniqueProducts = await applyTierBoost(uniqueProducts);

// Step 3: Continue with existing code (filtering, AI-Ranker, etc.)

*/

// ==========================================
// OPTIONAL: Cache clear endpoint
// ==========================================
// Add this to allow manual cache refresh (useful for testing)
/*
export async function GET(req: NextRequest) {
  brandMetadataCache = null;
  return NextResponse.json({
    message: 'TIER_BOOST cache cleared',
    timestamp: new Date().toISOString()
  });
}
*/
