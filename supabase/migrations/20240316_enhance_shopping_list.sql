-- Enhance shopping list with variation support
ALTER TABLE shopping_list
  ADD COLUMN variation_id UUID REFERENCES recipe_variations(id) ON DELETE SET NULL,
  ADD COLUMN notes TEXT,
  ADD COLUMN is_substitution BOOLEAN DEFAULT FALSE;

-- Add indexes for performance
CREATE INDEX idx_shopping_list_variation ON shopping_list(variation_id);
CREATE INDEX idx_shopping_list_recipe_variation ON shopping_list(recipe_id, variation_id);

-- Create a function to merge duplicate ingredients
CREATE OR REPLACE FUNCTION merge_shopping_list_items()
RETURNS TRIGGER AS $$
BEGIN
  -- If there's an existing item with the same ingredient and unit
  WITH duplicates AS (
    SELECT id, quantity
    FROM shopping_list
    WHERE user_id = NEW.user_id
      AND ingredient = NEW.ingredient
      AND unit = NEW.unit
      AND id != NEW.id
  )
  UPDATE shopping_list
  SET quantity = CAST(CAST(shopping_list.quantity AS DECIMAL) + CAST(NEW.quantity AS DECIMAL) AS TEXT)
  FROM duplicates
  WHERE shopping_list.id = duplicates.id
  AND shopping_list.quantity ~ '^[0-9]*\.?[0-9]*$'
  AND NEW.quantity ~ '^[0-9]*\.?[0-9]*$';

  -- Delete duplicates
  DELETE FROM shopping_list
  WHERE user_id = NEW.user_id
    AND ingredient = NEW.ingredient
    AND unit = NEW.unit
    AND id != NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for merging duplicates
CREATE TRIGGER merge_shopping_list_items_trigger
  AFTER INSERT OR UPDATE ON shopping_list
  FOR EACH ROW
  EXECUTE FUNCTION merge_shopping_list_items(); 