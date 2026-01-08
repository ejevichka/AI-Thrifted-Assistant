-- Migration: Create vibe_entities table for brand VibeDNA vectors
-- This replaces the old text-embedding approach with style-based vectors

-- Enable pgvector extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS vector;

-- Drop old table if exists (clean slate)
DROP TABLE IF EXISTS vibe_entities CASCADE;

-- Create new vibe_entities table
-- Each brand gets a 24-dimensional vector representing its relevance to each style
CREATE TABLE vibe_entities (
  id SERIAL PRIMARY KEY,
  entity_name TEXT UNIQUE NOT NULL,
  entity_type TEXT NOT NULL DEFAULT 'brand', -- 'brand' or 'hashtag' or 'aesthetic'

  -- 24-dimensional vector: one score per style
  -- Order: casual, formal, sporty, vintage, bohemian, y2k, grunge, goth,
  --        techwear, gorpcore, academia, avantgarde, streetwear, cottagecore,
  --        clubkid, balletcore, kfashion, harajuku, minimaljapan, deconstructed,
  --        eclecticgrandpa, mobwife, blokecore, officesiren
  vibe_vector VECTOR(24) NOT NULL,

  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create HNSW index for fast cosine similarity search
-- This enables sub-millisecond searches even with thousands of brands
CREATE INDEX vibe_entities_vector_idx ON vibe_entities
USING HNSW (vibe_vector vector_cosine_ops);

-- Create index on entity_type for filtering
CREATE INDEX vibe_entities_type_idx ON vibe_entities(entity_type);

-- Create index on entity_name for lookups
CREATE INDEX vibe_entities_name_idx ON vibe_entities(entity_name);

-- Create function for similarity search by style
-- This function takes a style_id and returns brands sorted by relevance
CREATE OR REPLACE FUNCTION search_brands_by_style(
  target_style_id TEXT,
  match_limit INT DEFAULT 20,
  min_similarity FLOAT DEFAULT 0.3
) RETURNS TABLE (
  entity_name TEXT,
  similarity FLOAT,
  metadata JSONB
) LANGUAGE plpgsql AS $$
DECLARE
  style_index INT;
  target_vector VECTOR(24);
  style_ids TEXT[] := ARRAY[
    'casual', 'formal', 'sporty', 'vintage', 'bohemian', 'y2k',
    'grunge', 'goth', 'techwear', 'gorpcore', 'academia', 'avantgarde',
    'streetwear', 'cottagecore', 'clubkid', 'balletcore', 'kfashion',
    'harajuku', 'minimaljapan', 'deconstructed', 'eclecticgrandpa',
    'mobwife', 'blokecore', 'officesiren'
  ];
BEGIN
  -- Find the index of target style (1-indexed in PostgreSQL)
  style_index := array_position(style_ids, target_style_id);

  IF style_index IS NULL THEN
    RAISE EXCEPTION 'Invalid style_id: %', target_style_id;
  END IF;

  -- Create target vector with 1.0 at the style position, 0.0 elsewhere
  target_vector := array_fill(0::float, ARRAY[24])::VECTOR(24);

  -- Unfortunately we can't directly set array elements in PL/pgSQL vector type
  -- So we'll use the query approach instead
  RETURN QUERY
  WITH target AS (
    -- Build target vector dynamically
    SELECT ('[' ||
      string_agg(
        CASE WHEN generate_series = style_index THEN '1.0' ELSE '0.0' END,
        ','
      ) || ']')::VECTOR(24) AS vec
    FROM generate_series(1, 24)
  )
  SELECT
    ve.entity_name,
    (1 - (ve.vibe_vector <=> target.vec))::FLOAT AS similarity,
    ve.metadata
  FROM vibe_entities ve, target
  WHERE ve.entity_type = 'brand'
    AND (1 - (ve.vibe_vector <=> target.vec)) >= min_similarity
  ORDER BY ve.vibe_vector <=> target.vec
  LIMIT match_limit;
END;
$$;

-- Create function for multi-style search (weighted combination)
CREATE OR REPLACE FUNCTION search_brands_by_styles(
  style_weights JSONB, -- e.g., '{"y2k": 0.8, "grunge": 0.5}'
  match_limit INT DEFAULT 20,
  min_similarity FLOAT DEFAULT 0.3
) RETURNS TABLE (
  entity_name TEXT,
  similarity FLOAT,
  metadata JSONB
) LANGUAGE plpgsql AS $$
DECLARE
  target_vector FLOAT[];
  style_ids TEXT[] := ARRAY[
    'casual', 'formal', 'sporty', 'vintage', 'bohemian', 'y2k',
    'grunge', 'goth', 'techwear', 'gorpcore', 'academia', 'avantgarde',
    'streetwear', 'cottagecore', 'clubkid', 'balletcore', 'kfashion',
    'harajuku', 'minimaljapan', 'deconstructed', 'eclecticgrandpa',
    'mobwife', 'blokecore', 'officesiren'
  ];
  style_id TEXT;
  weight FLOAT;
BEGIN
  -- Initialize target vector with zeros
  target_vector := array_fill(0::float, ARRAY[24]);

  -- Fill in weights from JSONB
  FOR style_id, weight IN
    SELECT key, value::text::float
    FROM jsonb_each_text(style_weights)
  LOOP
    target_vector[array_position(style_ids, style_id)] := weight;
  END LOOP;

  -- Execute search
  RETURN QUERY
  SELECT
    ve.entity_name,
    (1 - (ve.vibe_vector <=> target_vector::VECTOR(24)))::FLOAT AS similarity,
    ve.metadata
  FROM vibe_entities ve
  WHERE ve.entity_type = 'brand'
    AND (1 - (ve.vibe_vector <=> target_vector::VECTOR(24))) >= min_similarity
  ORDER BY ve.vibe_vector <=> target_vector::VECTOR(24)
  LIMIT match_limit;
END;
$$;

-- Create function to find brands similar to a given brand
CREATE OR REPLACE FUNCTION find_similar_brands(
  brand_name TEXT,
  match_limit INT DEFAULT 10,
  min_similarity FLOAT DEFAULT 0.5
) RETURNS TABLE (
  entity_name TEXT,
  similarity FLOAT,
  shared_styles TEXT[],
  metadata JSONB
) LANGUAGE plpgsql AS $$
DECLARE
  brand_vector VECTOR(24);
  style_ids TEXT[] := ARRAY[
    'casual', 'formal', 'sporty', 'vintage', 'bohemian', 'y2k',
    'grunge', 'goth', 'techwear', 'gorpcore', 'academia', 'avantgarde',
    'streetwear', 'cottagecore', 'clubkid', 'balletcore', 'kfashion',
    'harajuku', 'minimaljapan', 'deconstructed', 'eclecticgrandpa',
    'mobwife', 'blokecore', 'officesiren'
  ];
BEGIN
  -- Get the brand's vector
  SELECT vibe_vector INTO brand_vector
  FROM vibe_entities
  WHERE entity_name = brand_name AND entity_type = 'brand';

  IF brand_vector IS NULL THEN
    RAISE EXCEPTION 'Brand not found: %', brand_name;
  END IF;

  -- Find similar brands
  RETURN QUERY
  WITH similarities AS (
    SELECT
      ve.entity_name,
      (1 - (ve.vibe_vector <=> brand_vector))::FLOAT AS sim,
      ve.vibe_vector,
      ve.metadata
    FROM vibe_entities ve
    WHERE ve.entity_type = 'brand'
      AND ve.entity_name != brand_name
      AND (1 - (ve.vibe_vector <=> brand_vector)) >= min_similarity
    ORDER BY ve.vibe_vector <=> brand_vector
    LIMIT match_limit
  )
  SELECT
    s.entity_name,
    s.sim,
    -- Extract shared styles (where both brands score > 0.3)
    ARRAY(
      SELECT style_ids[i]
      FROM generate_series(1, 24) i
      WHERE (brand_vector::float[])[i] > 0.3
        AND (s.vibe_vector::float[])[i] > 0.3
    ) AS shared_styles,
    s.metadata
  FROM similarities s;
END;
$$;

-- Add comments for documentation
COMMENT ON TABLE vibe_entities IS 'Stores brand VibeDNA vectors for style-based similarity search';
COMMENT ON COLUMN vibe_entities.vibe_vector IS '24-dimensional vector representing brand relevance to each fashion style (0.0-1.0)';
COMMENT ON FUNCTION search_brands_by_style IS 'Find brands most relevant to a single style';
COMMENT ON FUNCTION search_brands_by_styles IS 'Find brands matching a weighted combination of multiple styles';
COMMENT ON FUNCTION find_similar_brands IS 'Find brands with similar vibe to a given brand';
