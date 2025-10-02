// Aesthetic Tags Data
export interface AestheticTag {
  tag_id: string;
  tag_name: string;
  parent_category: string;
  sub_category: string;
  aka: string;
  description: string;
  keywords: string;
}

export const AESTHETIC_TAGS: AestheticTag[] = [
  // Core Aesthetics
  {
    tag_id: "CORE001",
    tag_name: "minimalist",
    parent_category: "Core Aesthetics",
    sub_category: "N/A",
    aka: "normcore;scandi_minimalism",
    description: "A \"less is more\" philosophy focused on clean lines, neutral colors, and high-quality, simple silhouettes.",
    keywords: "neutral palette;monochrome;clean lines;uncluttered;structured;tailoring;basics;capsule wardrobe"
  },
  {
    tag_id: "CORE002",
    tag_name: "maximalist",
    parent_category: "Core Aesthetics",
    sub_category: "N/A",
    aka: "eclectic;dopamine_dressing",
    description: "A \"more is more\" philosophy embracing bold patterns, vibrant colors, rich textures, and layered accessorizing.",
    keywords: "bold prints;vibrant colors;clashing patterns;embellishment;sequins;faux fur;statement jewelry;layered"
  },
  {
    tag_id: "CORE003",
    tag_name: "avant_garde",
    parent_category: "Core Aesthetics",
    sub_category: "N/A",
    aka: "experimental;deconstructed",
    description: "Fashion that is experimental, innovative, and pushes the boundaries of conventional design and silhouettes.",
    keywords: "asymmetrical;deconstructed;unconventional materials;sculptural;architectural;conceptual;dramatic"
  },
  {
    tag_id: "CORE004",
    tag_name: "bohemian",
    parent_category: "Core Aesthetics",
    sub_category: "N/A",
    aka: "boho_chic;hippie",
    description: "A free-spirited, artistic style inspired by hippie culture, featuring natural fabrics, earthy tones, and folk-inspired patterns.",
    keywords: "crochet;fringe;suede;peasant blouse;maxi skirt;floral prints;earth tones;flowy;natural fabrics"
  },
  {
    tag_id: "CORE005",
    tag_name: "preppy",
    parent_category: "Core Aesthetics",
    sub_category: "N/A",
    aka: "ivy_league;classic_american",
    description: "A clean, collegiate-inspired style characterized by classic tailoring, nautical themes, and sporty influences.",
    keywords: "polo shirt;argyle;plaid;khakis;blazer;boat shoes;cable knit;oxford shirt;pearls"
  },
  {
    tag_id: "CORE006",
    tag_name: "streetwear",
    parent_category: "Core Aesthetics",
    sub_category: "N/A",
    aka: "urban;hypebeast",
    description: "A casual style originating from skate and hip-hop culture, focusing on comfortable, graphic-heavy pieces and branded sneakers.",
    keywords: "hoodie;graphic tee;sneakers;joggers;bomber jacket;logo-heavy;baggy fit;snapback"
  },
  {
    tag_id: "CORE007",
    tag_name: "goth",
    parent_category: "Core Aesthetics",
    sub_category: "N/A",
    aka: "gothic",
    description: "A dark, dramatic, and romantic style drawing from Victorian and punk aesthetics, characterized by a predominantly black color palette.",
    keywords: "black;lace;velvet;leather;corset;fishnets;platform boots;dark makeup;silver jewelry"
  },
  {
    tag_id: "CORE008",
    tag_name: "grunge",
    parent_category: "Core Aesthetics",
    sub_category: "N/A",
    aka: "90s_grunge",
    description: "An anti-fashion, non-conformist style from the 90s rock scene, defined by a messy, layered, and androgynous look.",
    keywords: "flannel shirt;ripped jeans;band tee;combat boots;cardigan;plaid;distressed;oversized;layered"
  },
  {
    tag_id: "CORE009",
    tag_name: "punk",
    parent_category: "Core Aesthetics",
    sub_category: "N/A",
    aka: "70s_punk",
    description: "An aggressive, rebellious style characterized by DIY ethics, leather, plaid, and anti-establishment imagery.",
    keywords: "leather jacket;tartan;studs;spikes;safety pins;band patches;ripped clothing;doc martens;bondage pants"
  },

  // Era-Specific
  {
    tag_id: "ERA001",
    tag_name: "roaring_20s",
    parent_category: "Era-Specific",
    sub_category: "1920s",
    aka: "flapper",
    description: "Characterized by dropped waists, beaded embellishments, and a celebration of youthful exuberance and freedom.",
    keywords: "drop waist dress;beading;fringe;cloche hat;art deco;feathers;long pearls;t-strap heels"
  },
  {
    tag_id: "ERA002",
    tag_name: "old_hollywood",
    parent_category: "Era-Specific",
    sub_category: "1930s-1940s",
    aka: "golden_age_glamour",
    description: "A sophisticated and glamorous style defined by elegant gowns, luxurious fabrics, and impeccable tailoring.",
    keywords: "bias cut gowns;silk;satin;fur stoles;long gloves;wide-leg trousers;structured shoulders"
  },
  {
    tag_id: "ERA003",
    tag_name: "rockabilly",
    parent_category: "Era-Specific",
    sub_category: "1950s",
    aka: "50s_retro",
    description: "A style blending rock and roll with country music influences, featuring playful, body-conscious silhouettes.",
    keywords: "pencil skirt;high-waisted shorts;halter top;polka dots;gingham;cherry print;bandana"
  },
  {
    tag_id: "ERA004",
    tag_name: "mod",
    parent_category: "Era-Specific",
    sub_category: "1960s",
    aka: "swinging_sixties",
    description: "A youth-driven style from London featuring bold, graphic patterns, A-line silhouettes, and a futuristic feel.",
    keywords: "miniskirt;a-line dress;shift dress;go-go boots;color blocking;op art prints;turtleneck"
  },
  {
    tag_id: "ERA005",
    tag_name: "hippie",
    parent_category: "Era-Specific",
    sub_category: "1960s-1970s",
    aka: "flower_child",
    description: "A counter-culture style promoting peace and love, defined by psychedelic prints, natural fabrics, and handcrafted elements.",
    keywords: "bell bottoms;tie-dye;peasant blouses;kaftans;crochet;fringe;flower crown;suede"
  },
  {
    tag_id: "ERA006",
    tag_name: "disco",
    parent_category: "Era-Specific",
    sub_category: "1970s",
    aka: "studio_54",
    description: "A glamorous, high-shine aesthetic born from the 70s nightlife scene, made for movement and catching the light.",
    keywords: "sequins;lurex;flared jumpsuits;platform shoes;halter necks;gold lamé;wrap dresses"
  },
  {
    tag_id: "ERA007",
    tag_name: "80s_glam",
    parent_category: "Era-Specific",
    sub_category: "1980s",
    aka: "power_dressing",
    description: "An era of excess defined by bold silhouettes, neon colors, and a focus on status and branding.",
    keywords: "shoulder pads;power suit;acid wash jeans;neon;spandex;leg warmers;statement belts;animal print"
  },
  {
    tag_id: "ERA008",
    tag_name: "90s_hip_hop",
    parent_category: "Era-Specific",
    sub_category: "1990s",
    aka: "urban_90s",
    description: "An influential streetwear style characterized by baggy silhouettes, sportswear brands, and bold logos.",
    keywords: "baggy jeans;tracksuit;sports jerseys;puffer jacket;timberland boots;bucket hat;gold chains"
  },
  {
    tag_id: "ERA009",
    tag_name: "y2k",
    parent_category: "Era-Specific",
    sub_category: "2000s",
    aka: "2000s_fashion;cyber_y2k",
    description: "A futuristic and playful style from the late 90s/early 2000s, influenced by technology and pop culture.",
    keywords: "low-rise jeans;crop top;velour tracksuit;rhinestones;metallic fabrics;pleated skirt;butterfly clips"
  },

  // Micro-Trends/Vibes
  {
    tag_id: "MICRO001",
    tag_name: "gorpcore",
    parent_category: "Micro-Trends/Vibes",
    sub_category: "Outdoor",
    aka: "techwear;utilitarian",
    description: "An aesthetic centered on functional, utilitarian outdoor and hiking gear worn in urban environments.",
    keywords: "fleece jacket;puffer jacket;cargo pants;hiking boots;technical fabrics;gore-tex;arcteryx;patagonia"
  },
  {
    tag_id: "MICRO002",
    tag_name: "techwear",
    parent_category: "Micro-Trends/Vibes",
    sub_category: "Outdoor",
    aka: "cyberpunk;warcore",
    description: "A futuristic, utilitarian aesthetic focused on high-performance fabrics, tactical details, and a monochrome palette.",
    keywords: "technical fabrics;straps;buckles;cargo pockets;waterproof;windproof;acronym;nike acg"
  },
  {
    tag_id: "MICRO003",
    tag_name: "dark_academia",
    parent_category: "Micro-Trends/Vibes",
    sub_category: "Academia",
    aka: "N/A",
    description: "An aesthetic romanticizing classic literature and liberal arts education, with a dark, moody, and scholarly feel.",
    keywords: "tweed blazer;cardigan;turtleneck;plaid trousers;oxfords;dark color palette;wool;cashmere"
  },
  {
    tag_id: "MICRO004",
    tag_name: "light_academia",
    parent_category: "Micro-Trends/Vibes",
    sub_category: "Academia",
    aka: "N/A",
    description: "A lighter, more optimistic counterpart to Dark Academia, focusing on poetry, art, and nature with a soft color palette.",
    keywords: "linen shirts;cable knit sweaters;light-colored trousers;beige;cream;ivory;soft fabrics"
  },
  {
    tag_id: "MICRO005",
    tag_name: "romantic_academia",
    parent_category: "Micro-Trends/Vibes",
    sub_category: "Academia",
    aka: "N/A",
    description: "Blends academia with romanticism, focusing on emotion, beauty, and nature. Features softer silhouettes and delicate details.",
    keywords: "lace collars;puff sleeves;velvet ribbons;floral embroidery;long skirts;locket necklace"
  },
  {
    tag_id: "MICRO006",
    tag_name: "sleaze_academia",
    parent_category: "Micro-Trends/Vibes",
    sub_category: "Academia",
    aka: "indie_sleaze_academia",
    description: "A grungier, more rebellious take on academia, inspired by 90s and indie sleaze aesthetics.",
    keywords: "distressed sweaters;ripped tights;smudged eyeliner;leather jacket over uniform;band tees"
  },
  {
    tag_id: "MICRO007",
    tag_name: "cottagecore",
    parent_category: "Micro-Trends/Vibes",
    sub_category: "Nature & Fantasy",
    aka: "farmcore;grandmacore",
    description: "An aesthetic romanticizing a simple, rural life. It emphasizes harmony with nature, crafting, and pastoral beauty.",
    keywords: "prairie dress;puff sleeves;gingham;floral prints;embroidery;knits;linen;natural fibers"
  },
  {
    tag_id: "MICRO008",
    tag_name: "fairycore",
    parent_category: "Micro-Trends/Vibes",
    sub_category: "Nature & Fantasy",
    aka: "faecore",
    description: "A whimsical, ethereal aesthetic inspired by fairy mythology and magical forests.",
    keywords: "iridescent fabrics;sheer tulle;lace;ribbons;corsets;earthy tones;glitter;flower crowns"
  },
  {
    tag_id: "MICRO009",
    tag_name: "balletcore",
    parent_category: "Micro-Trends/Vibes",
    sub_category: "Feminine & Romantic",
    aka: "ballerina_sleaze",
    description: "Inspired by the aesthetics of ballet dancers, both in practice and performance. It's delicate, graceful, and athletic.",
    keywords: "ballet flats;leg warmers;wrap tops;bodysuits;tulle skirts;ribbons;pale pink;soft pastels"
  },
  {
    tag_id: "MICRO010",
    tag_name: "coquette",
    parent_category: "Micro-Trends/Vibes",
    sub_category: "Feminine & Romantic",
    aka: "dollette;nymphet",
    description: "A hyper-feminine, romantic, and slightly nostalgic aesthetic that plays with themes of girlhood and flirtation.",
    keywords: "lace;ribbons;bows;pearls;frills;satin;babydoll dress;mary janes;heart motifs"
  },
  {
    tag_id: "MICRO011",
    tag_name: "angelcore",
    parent_category: "Micro-Trends/Vibes",
    sub_category: "Feminine & Romantic",
    aka: "N/A",
    description: "An ethereal aesthetic inspired by angels and classical art, focusing on softness, purity, and light.",
    keywords: "white;cream;pastels;sheer fabric;silk;lace;feathers;cherub prints;delicate jewelry"
  },
  {
    tag_id: "MICRO012",
    tag_name: "barbiecore",
    parent_category: "Micro-Trends/Vibes",
    sub_category: "Pop Culture",
    aka: "N/A",
    description: "A vibrant, playful aesthetic centered around the iconic doll, embracing all shades of pink and ultra-feminine silhouettes.",
    keywords: "hot pink;monochromatic pink;mini dresses;platform heels;plastic jewelry;glitter;feathers"
  },
  {
    tag_id: "MICRO013",
    tag_name: "mob_wife",
    parent_category: "Micro-Trends/Vibes",
    sub_category: "Luxury & Chic",
    aka: "mafia_chic",
    description: "A bold, unapologetically glamorous aesthetic inspired by the wives of mafia figures in pop culture.",
    keywords: "faux fur coat;leopard print;leather skirt;gold jewelry;designer logos;stiletto heels;dark sunglasses"
  },
  {
    tag_id: "MICRO014",
    tag_name: "quiet_luxury",
    parent_category: "Micro-Trends/Vibes",
    sub_category: "Luxury & Chic",
    aka: "stealth_wealth;minimalist_luxury",
    description: "A minimalist approach to luxury that focuses on high-quality materials and impeccable tailoring over conspicuous branding.",
    keywords: "cashmere sweater;tailored coat;silk blouse;neutral colors;no logos;investment pieces;perfect fit"
  },
  {
    tag_id: "MICRO015",
    tag_name: "old_money",
    parent_category: "Micro-Trends/Vibes",
    sub_category: "Luxury & Chic",
    aka: "wasp;east_coast_prep",
    description: "An aesthetic that conveys generational wealth through timeless, well-made, and understated classic clothing.",
    keywords: "linen shirts;tweed jackets;polo shirts;riding boots;pearls;family heirlooms;heritage brands"
  },
  {
    tag_id: "MICRO016",
    tag_name: "biker",
    parent_category: "Micro-Trends/Vibes",
    sub_category: "Subculture",
    aka: "moto_glam;motorcycle_chic",
    description: "Inspired by motorcycle culture, this aesthetic is tough, edgy, and heavily reliant on leather.",
    keywords: "leather jacket;moto boots;bandana;distressed denim;silver hardware;zippers;studs"
  },
  {
    tag_id: "MICRO017",
    tag_name: "feral_chic",
    parent_category: "Micro-Trends/Vibes",
    sub_category: "Avant-Garde",
    aka: "post-apocalyptic",
    description: "A deconstructed, raw, and earthy aesthetic that looks intentionally undone and connected to nature in a wild way.",
    keywords: "raw hems;asymmetrical layers;distressed fabrics;earthy tones;found objects;netting;unconventional materials"
  },
  {
    tag_id: "MICRO018",
    tag_name: "space_age",
    parent_category: "Micro-Trends/Vibes",
    sub_category: "Futuristic",
    aka: "60s_futurism;atomic_age",
    description: "A retro-futuristic style from the 60s inspired by the space race, featuring synthetic materials and geometric shapes.",
    keywords: "pvc;vinyl;metallic silver;go-go boots;bubble helmet;a-line mini dress;geometric prints"
  },
  {
    tag_id: "MICRO019",
    tag_name: "mermaidcore",
    parent_category: "Micro-Trends/Vibes",
    sub_category: "Nature & Fantasy",
    aka: "sirencore",
    description: "An aesthetic inspired by mermaids and the ocean, featuring iridescent materials, aquatic colors, and flowing silhouettes.",
    keywords: "iridescent sequins;crochet;netting;scallop details;pearls;shades of blue and green;sheer fabrics"
  },

  // Origin/Style Focus
  {
    tag_id: "ORIGIN001",
    tag_name: "italian_vintage",
    parent_category: "Origin/Style Focus",
    sub_category: "European",
    aka: "la_dolce_vita",
    description: "Refers to high-quality, often glamorous, and well-tailored vintage pieces from iconic Italian designers.",
    keywords: "luxury leather;tailored suits;statement sunglasses;silk scarves;bold prints;ferragamo;gucci;versace"
  },
  {
    tag_id: "ORIGIN002",
    tag_name: "french_chic",
    parent_category: "Origin/Style Focus",
    sub_category: "European",
    aka: "parisian_style",
    description: "An effortless, timeless, and understated style that prioritizes fit, quality, and a neutral color palette.",
    keywords: "trench coat;breton stripe shirt;ballet flats;straight-leg jeans;silk scarf;basket bag;minimalist"
  },
  {
    tag_id: "ORIGIN003",
    tag_name: "scandi_minimalism",
    parent_category: "Origin/Style Focus",
    sub_category: "European",
    aka: "scandinavian_style",
    description: "A functional, minimalist aesthetic from Nordic countries, focusing on clean lines, comfort, and a muted color palette.",
    keywords: "neutral tones;oversized sweaters;wide-leg trousers;white sneakers;functional outerwear;wool;linen"
  },
  {
    tag_id: "ORIGIN004",
    tag_name: "japanese_streetwear",
    parent_category: "Origin/Style Focus",
    sub_category: "Asian",
    aka: "harajuku;shibuya",
    description: "A broad category for the diverse and experimental fashion subcultures originating from Japan.",
    keywords: "avant-garde silhouettes;layered looks;wide pants;platform shoes;anime graphics;kawaii;lolita"
  },
  {
    tag_id: "ORIGIN005",
    tag_name: "denim_couture",
    parent_category: "Origin/Style Focus",
    sub_category: "Material",
    aka: "elevated_denim",
    description: "The art of treating denim not as a basic, but as a fabric for high-fashion, structured, and experimental pieces.",
    keywords: "denim-on-denim;structured denim;deconstructed jeans;embellished jackets;jean corsets"
  },
  {
    tag_id: "ORIGIN006",
    tag_name: "luxury_leather",
    parent_category: "Origin/Style Focus",
    sub_category: "Material",
    aka: "N/A",
    description: "An aesthetic centered on high-quality leather goods, from classic jackets to structured bags and tailored trousers.",
    keywords: "leather jacket;leather pants;leather skirt;structured handbag;high-quality hide;buttery soft"
  },
  {
    tag_id: "ORIGIN007",
    tag_name: "african_wax_print",
    parent_category: "Origin/Style Focus",
    sub_category: "Global",
    aka: "ankara;kitenge",
    description: "Characterized by bold, colorful, and symbolic patterns on cotton fabric, used in modern and traditional African garments.",
    keywords: "bold patterns;vibrant colors;geometric motifs;symbolic designs;headwraps;tailored dresses"
  },
  {
    tag_id: "ORIGIN008",
    tag_name: "latin_american_embroidery",
    parent_category: "Origin/Style Focus",
    sub_category: "Global",
    aka: "mexican_embroidery;otomí",
    description: "Vibrant and intricate floral and faunal embroidery, often handmade, on cotton garments like blouses and dresses.",
    keywords: "floral embroidery;vibrant thread;puebla dress;huipil;hand-stitched;folk art"
  }
];