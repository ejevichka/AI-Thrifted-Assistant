// Fashion Brands Classification Data
export interface BrandClassification {
  brand: string;
  aesthetics: string[];
  primary_aesthetic: string;
  price_tier: 'budget' | 'mid' | 'luxury' | 'ultra_luxury';
  origin?: string;
}

export const CLASSIFIED_BRANDS: BrandClassification[] = [
  // Core Aesthetics - Minimalist
  {
    brand: "acne studios",
    aesthetics: ["minimalist", "scandi_minimalism"],
    primary_aesthetic: "minimalist",
    price_tier: "luxury",
    origin: "swedish"
  },
  {
    brand: "a.p.c.",
    aesthetics: ["minimalist", "french_chic"],
    primary_aesthetic: "minimalist",
    price_tier: "mid",
    origin: "french"
  },
  {
    brand: "cos",
    aesthetics: ["minimalist", "scandi_minimalism"],
    primary_aesthetic: "minimalist",
    price_tier: "mid",
    origin: "swedish"
  },
  {
    brand: "everlane",
    aesthetics: ["minimalist", "quiet_luxury"],
    primary_aesthetic: "minimalist",
    price_tier: "mid",
    origin: "american"
  },

  // Core Aesthetics - Streetwear
  {
    brand: "supreme",
    aesthetics: ["streetwear", "90s_hip_hop"],
    primary_aesthetic: "streetwear",
    price_tier: "luxury",
    origin: "american"
  },
  {
    brand: "a bathing ape",
    aesthetics: ["streetwear", "japanese_streetwear"],
    primary_aesthetic: "streetwear",
    price_tier: "luxury",
    origin: "japanese"
  },
  {
    brand: "off-white",
    aesthetics: ["streetwear", "avant_garde"],
    primary_aesthetic: "streetwear",
    price_tier: "luxury",
    origin: "italian"
  },
  {
    brand: "palace",
    aesthetics: ["streetwear"],
    primary_aesthetic: "streetwear",
    price_tier: "mid",
    origin: "british"
  },
  {
    brand: "stussy",
    aesthetics: ["streetwear", "90s_hip_hop"],
    primary_aesthetic: "streetwear",
    price_tier: "mid",
    origin: "american"
  },

  // Core Aesthetics - Avant Garde
  {
    brand: "comme des garcons",
    aesthetics: ["avant_garde", "japanese_streetwear"],
    primary_aesthetic: "avant_garde",
    price_tier: "luxury",
    origin: "japanese"
  },
  {
    brand: "yohji yamamoto",
    aesthetics: ["avant_garde", "japanese_streetwear"],
    primary_aesthetic: "avant_garde",
    price_tier: "luxury",
    origin: "japanese"
  },
  {
    brand: "rick owens",
    aesthetics: ["avant_garde", "goth"],
    primary_aesthetic: "avant_garde",
    price_tier: "luxury",
    origin: "american"
  },
  {
    brand: "issey miyake",
    aesthetics: ["avant_garde", "japanese_streetwear", "minimalist"],
    primary_aesthetic: "avant_garde",
    price_tier: "luxury",
    origin: "japanese"
  },

  // Core Aesthetics - Bohemian
  {
    brand: "free people",
    aesthetics: ["bohemian", "cottagecore"],
    primary_aesthetic: "bohemian",
    price_tier: "mid",
    origin: "american"
  },
  {
    brand: "zimmermann",
    aesthetics: ["bohemian", "romantic_academia"],
    primary_aesthetic: "bohemian",
    price_tier: "luxury",
    origin: "australian"
  },

  // Core Aesthetics - Preppy
  {
    brand: "polo ralph lauren",
    aesthetics: ["preppy", "old_money"],
    primary_aesthetic: "preppy",
    price_tier: "mid",
    origin: "american"
  },
  {
    brand: "tommy hilfiger",
    aesthetics: ["preppy"],
    primary_aesthetic: "preppy",
    price_tier: "mid",
    origin: "american"
  },
  {
    brand: "vineyard vines",
    aesthetics: ["preppy", "old_money"],
    primary_aesthetic: "preppy",
    price_tier: "mid",
    origin: "american"
  },

  // Core Aesthetics - Grunge
  {
    brand: "marc jacobs",
    aesthetics: ["grunge", "90s_hip_hop"],
    primary_aesthetic: "grunge",
    price_tier: "luxury",
    origin: "american"
  },

  // Era-Specific - Y2K
  {
    brand: "juicy couture",
    aesthetics: ["y2k", "barbiecore"],
    primary_aesthetic: "y2k",
    price_tier: "mid",
    origin: "american"
  },
  {
    brand: "von dutch",
    aesthetics: ["y2k"],
    primary_aesthetic: "y2k",
    price_tier: "mid",
    origin: "american"
  },

  // Luxury Brands
  {
    brand: "chanel",
    aesthetics: ["french_chic", "old_money", "quiet_luxury"],
    primary_aesthetic: "french_chic",
    price_tier: "ultra_luxury",
    origin: "french"
  },
  {
    brand: "dior",
    aesthetics: ["french_chic", "quiet_luxury"],
    primary_aesthetic: "french_chic",
    price_tier: "ultra_luxury",
    origin: "french"
  },
  {
    brand: "hermes",
    aesthetics: ["quiet_luxury", "old_money", "luxury_leather"],
    primary_aesthetic: "quiet_luxury",
    price_tier: "ultra_luxury",
    origin: "french"
  },
  {
    brand: "bottega veneta",
    aesthetics: ["quiet_luxury", "italian_vintage", "luxury_leather"],
    primary_aesthetic: "quiet_luxury",
    price_tier: "ultra_luxury",
    origin: "italian"
  },
  {
    brand: "the row",
    aesthetics: ["quiet_luxury", "minimalist"],
    primary_aesthetic: "quiet_luxury",
    price_tier: "ultra_luxury",
    origin: "american"
  },

  // Italian Luxury
  {
    brand: "gucci",
    aesthetics: ["maximalist", "italian_vintage"],
    primary_aesthetic: "maximalist",
    price_tier: "luxury",
    origin: "italian"
  },
  {
    brand: "prada",
    aesthetics: ["minimalist", "italian_vintage"],
    primary_aesthetic: "minimalist",
    price_tier: "luxury",
    origin: "italian"
  },
  {
    brand: "versace",
    aesthetics: ["maximalist", "italian_vintage", "80s_glam"],
    primary_aesthetic: "maximalist",
    price_tier: "luxury",
    origin: "italian"
  },
  {
    brand: "dolce & gabbana",
    aesthetics: ["maximalist", "italian_vintage"],
    primary_aesthetic: "maximalist",
    price_tier: "luxury",
    origin: "italian"
  },

  // Fast Fashion / Contemporary
  {
    brand: "zara",
    aesthetics: ["minimalist"],
    primary_aesthetic: "minimalist",
    price_tier: "budget",
    origin: "spanish"
  },
  {
    brand: "h&m",
    aesthetics: ["minimalist", "streetwear"],
    primary_aesthetic: "minimalist",
    price_tier: "budget",
    origin: "swedish"
  },
  {
    brand: "uniqlo",
    aesthetics: ["minimalist", "japanese_streetwear"],
    primary_aesthetic: "minimalist",
    price_tier: "budget",
    origin: "japanese"
  },

  // Athletic/Gorpcore
  {
    brand: "patagonia",
    aesthetics: ["gorpcore"],
    primary_aesthetic: "gorpcore",
    price_tier: "mid",
    origin: "american"
  },
  {
    brand: "arc'teryx",
    aesthetics: ["gorpcore", "techwear"],
    primary_aesthetic: "gorpcore",
    price_tier: "luxury",
    origin: "canadian"
  },
  {
    brand: "north face",
    aesthetics: ["gorpcore"],
    primary_aesthetic: "gorpcore",
    price_tier: "mid",
    origin: "american"
  },

  // Techwear
  {
    brand: "acronym",
    aesthetics: ["techwear", "avant_garde"],
    primary_aesthetic: "techwear",
    price_tier: "luxury",
    origin: "german"
  },

  // Denim Brands
  {
    brand: "levi's",
    aesthetics: ["denim_couture", "americana"],
    primary_aesthetic: "denim_couture",
    price_tier: "mid",
    origin: "american"
  },
  {
    brand: "7 for all mankind",
    aesthetics: ["denim_couture"],
    primary_aesthetic: "denim_couture",
    price_tier: "mid",
    origin: "american"
  },
  {
    brand: "citizens of humanity",
    aesthetics: ["denim_couture"],
    primary_aesthetic: "denim_couture",
    price_tier: "mid",
    origin: "american"
  }
];

// Helper function to find brands by aesthetic
export function getBrandsByAesthetic(aesthetic: string): string[] {
  return CLASSIFIED_BRANDS
    .filter(brand => 
      brand.aesthetics.includes(aesthetic) || 
      brand.primary_aesthetic === aesthetic
    )
    .map(brand => brand.brand);
}

// Helper function to find aesthetics by brand
export function getAestheticsByBrand(brandName: string): string[] {
  const brand = CLASSIFIED_BRANDS.find(b => 
    b.brand.toLowerCase() === brandName.toLowerCase()
  );
  return brand ? brand.aesthetics : [];
}

// Helper function to get brands by price tier
export function getBrandsByPriceTier(priceTier: string): string[] {
  return CLASSIFIED_BRANDS
    .filter(brand => brand.price_tier === priceTier)
    .map(brand => brand.brand);
}

// Helper function to get brands by origin
export function getBrandsByOrigin(origin: string): string[] {
  return CLASSIFIED_BRANDS
    .filter(brand => brand.origin === origin)
    .map(brand => brand.brand);
}