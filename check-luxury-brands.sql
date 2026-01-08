-- Find the 3 luxury tier brands
SELECT entity_name, metadata
FROM vibe_entities
WHERE metadata->>'tier' = 'luxury'
ORDER BY entity_name;
