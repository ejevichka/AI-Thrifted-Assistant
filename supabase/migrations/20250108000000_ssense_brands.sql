-- Migration: Create ssense_brands table for curated SSENSE brand vectors
-- Separate from vibe_entities to maintain curated high-quality brand data
-- Supports gender-based filtering (brands can be available for both men and women)

-- Enable pgvector extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS vector;

-- Create ssense_brands table
CREATE TABLE ssense_brands (
  id SERIAL PRIMARY KEY,

  -- Brand identification
  brand_name TEXT UNIQUE NOT NULL,
  ssense_slug TEXT NOT NULL,              -- URL slug for SSENSE website

  -- Gender availability (brands can overlap between categories)
  available_women BOOLEAN DEFAULT FALSE,
  available_men BOOLEAN DEFAULT FALSE,

  -- 24-dimensional VibeDNA vector (same as vibe_entities)
  -- Order: casual, formal, sporty, vintage, bohemian, y2k, grunge, goth,
  --        techwear, gorpcore, academia, avantgarde, streetwear, cottagecore,
  --        clubkid, balletcore, kfashion, harajuku, minimaljapan, deconstructed,
  --        eclecticgrandpa, mobwife, blokecore, officesiren
  vibe_vector VECTOR(24),

  -- Brand tier (icon/luxury/gem/affordable/mainstream)
  tier TEXT DEFAULT 'gem',

  -- Metadata (designer info, price range, etc.)
  metadata JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create HNSW index for fast cosine similarity search
CREATE INDEX ssense_brands_vector_idx ON ssense_brands
USING HNSW (vibe_vector vector_cosine_ops)
WHERE vibe_vector IS NOT NULL;

-- Create indexes for filtering
CREATE INDEX ssense_brands_name_idx ON ssense_brands(brand_name);
CREATE INDEX ssense_brands_slug_idx ON ssense_brands(ssense_slug);
CREATE INDEX ssense_brands_women_idx ON ssense_brands(available_women) WHERE available_women = TRUE;
CREATE INDEX ssense_brands_men_idx ON ssense_brands(available_men) WHERE available_men = TRUE;
CREATE INDEX ssense_brands_tier_idx ON ssense_brands(tier);

-- Create function for searching SSENSE brands by style with gender filter
CREATE OR REPLACE FUNCTION search_ssense_brands_by_style(
  target_style_id TEXT,
  gender_filter TEXT DEFAULT 'all',  -- 'women', 'men', 'all'
  match_limit INT DEFAULT 20,
  min_similarity FLOAT DEFAULT 0.3
) RETURNS TABLE (
  brand_name TEXT,
  ssense_slug TEXT,
  similarity FLOAT,
  tier TEXT,
  available_women BOOLEAN,
  available_men BOOLEAN,
  metadata JSONB
) LANGUAGE plpgsql AS $$
DECLARE
  style_index INT;
  style_ids TEXT[] := ARRAY[
    'casual', 'formal', 'sporty', 'vintage', 'bohemian', 'y2k',
    'grunge', 'goth', 'techwear', 'gorpcore', 'academia', 'avantgarde',
    'streetwear', 'cottagecore', 'clubkid', 'balletcore', 'kfashion',
    'harajuku', 'minimaljapan', 'deconstructed', 'eclecticgrandpa',
    'mobwife', 'blokecore', 'officesiren'
  ];
BEGIN
  -- Find the index of target style
  style_index := array_position(style_ids, target_style_id);

  IF style_index IS NULL THEN
    RAISE EXCEPTION 'Invalid style_id: %', target_style_id;
  END IF;

  RETURN QUERY
  WITH target AS (
    SELECT ('[' ||
      string_agg(
        CASE WHEN generate_series = style_index THEN '1.0' ELSE '0.0' END,
        ','
      ) || ']')::VECTOR(24) AS vec
    FROM generate_series(1, 24)
  )
  SELECT
    sb.brand_name,
    sb.ssense_slug,
    (1 - (sb.vibe_vector <=> target.vec))::FLOAT AS similarity,
    sb.tier,
    sb.available_women,
    sb.available_men,
    sb.metadata
  FROM ssense_brands sb, target
  WHERE sb.vibe_vector IS NOT NULL
    AND (1 - (sb.vibe_vector <=> target.vec)) >= min_similarity
    AND (
      gender_filter = 'all'
      OR (gender_filter = 'women' AND sb.available_women = TRUE)
      OR (gender_filter = 'men' AND sb.available_men = TRUE)
    )
  ORDER BY sb.vibe_vector <=> target.vec
  LIMIT match_limit;
END;
$$;

-- Create function to find SSENSE alternatives to a brand from vibe_entities
CREATE OR REPLACE FUNCTION find_ssense_alternatives(
  source_brand_name TEXT,
  gender_filter TEXT DEFAULT 'all',
  match_limit INT DEFAULT 5,
  min_similarity FLOAT DEFAULT 0.5
) RETURNS TABLE (
  ssense_brand TEXT,
  ssense_slug TEXT,
  similarity FLOAT,
  tier TEXT,
  shared_styles TEXT[]
) LANGUAGE plpgsql AS $$
DECLARE
  source_vector VECTOR(24);
  style_ids TEXT[] := ARRAY[
    'casual', 'formal', 'sporty', 'vintage', 'bohemian', 'y2k',
    'grunge', 'goth', 'techwear', 'gorpcore', 'academia', 'avantgarde',
    'streetwear', 'cottagecore', 'clubkid', 'balletcore', 'kfashion',
    'harajuku', 'minimaljapan', 'deconstructed', 'eclecticgrandpa',
    'mobwife', 'blokecore', 'officesiren'
  ];
BEGIN
  -- Try to get vector from vibe_entities first
  SELECT vibe_vector INTO source_vector
  FROM vibe_entities
  WHERE entity_name = source_brand_name AND entity_type = 'brand';

  -- If not found in vibe_entities, try ssense_brands
  IF source_vector IS NULL THEN
    SELECT vibe_vector INTO source_vector
    FROM ssense_brands
    WHERE brand_name = source_brand_name;
  END IF;

  IF source_vector IS NULL THEN
    RAISE EXCEPTION 'Brand not found: %', source_brand_name;
  END IF;

  RETURN QUERY
  WITH similarities AS (
    SELECT
      sb.brand_name,
      sb.ssense_slug,
      (1 - (sb.vibe_vector <=> source_vector))::FLOAT AS sim,
      sb.vibe_vector,
      sb.tier
    FROM ssense_brands sb
    WHERE sb.vibe_vector IS NOT NULL
      AND sb.brand_name != source_brand_name
      AND (1 - (sb.vibe_vector <=> source_vector)) >= min_similarity
      AND (
        gender_filter = 'all'
        OR (gender_filter = 'women' AND sb.available_women = TRUE)
        OR (gender_filter = 'men' AND sb.available_men = TRUE)
      )
    ORDER BY sb.vibe_vector <=> source_vector
    LIMIT match_limit
  )
  SELECT
    s.brand_name,
    s.ssense_slug,
    s.sim,
    s.tier,
    ARRAY(
      SELECT style_ids[i]
      FROM generate_series(1, 24) i
      WHERE (source_vector::float[])[i] > 0.3
        AND (s.vibe_vector::float[])[i] > 0.3
    ) AS shared_styles
  FROM similarities s;
END;
$$;

-- Create function to get all SSENSE brands with their vectors
CREATE OR REPLACE FUNCTION get_ssense_brands_with_vectors(
  gender_filter TEXT DEFAULT 'all'
) RETURNS TABLE (
  brand_name TEXT,
  ssense_slug TEXT,
  tier TEXT,
  vibe_vector VECTOR(24),
  available_women BOOLEAN,
  available_men BOOLEAN
) LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT
    sb.brand_name,
    sb.ssense_slug,
    sb.tier,
    sb.vibe_vector,
    sb.available_women,
    sb.available_men
  FROM ssense_brands sb
  WHERE sb.vibe_vector IS NOT NULL
    AND (
      gender_filter = 'all'
      OR (gender_filter = 'women' AND sb.available_women = TRUE)
      OR (gender_filter = 'men' AND sb.available_men = TRUE)
    )
  ORDER BY sb.tier, sb.brand_name;
END;
$$;

-- Add comments
COMMENT ON TABLE ssense_brands IS 'Curated SSENSE brand catalog with VibeDNA vectors for style matching';
COMMENT ON COLUMN ssense_brands.ssense_slug IS 'URL slug for constructing SSENSE product links';
COMMENT ON COLUMN ssense_brands.available_women IS 'Brand available in SSENSE women category';
COMMENT ON COLUMN ssense_brands.available_men IS 'Brand available in SSENSE men category';
COMMENT ON FUNCTION search_ssense_brands_by_style IS 'Find SSENSE brands matching a style with optional gender filter';
COMMENT ON FUNCTION find_ssense_alternatives IS 'Find SSENSE brand alternatives to any brand from vibe_entities or ssense_brands';
