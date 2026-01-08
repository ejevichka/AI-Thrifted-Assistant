-- Fix ambiguous column reference in find_similar_brands function
CREATE OR REPLACE FUNCTION find_similar_brands(
  brand_name TEXT,
  match_limit INT DEFAULT 20,
  min_similarity FLOAT DEFAULT 0.3
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
  WHERE vibe_entities.entity_name = brand_name AND entity_type = 'brand';

  IF brand_vector IS NULL THEN
    RAISE EXCEPTION 'Brand not found: %', brand_name;
  END IF;

  -- Find similar brands
  RETURN QUERY
  WITH similarities AS (
    SELECT
      ve.entity_name AS brand_name_result,
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
    s.brand_name_result,
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
