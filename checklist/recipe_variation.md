Below is a concise, step-by-step plan for integrating recipe variation storage, a simple “back to original recipe” function, and a minimal variation history into your existing codebase, consistent with your answers:

---

## 1. Database Schema Adjustment

Create a new model (e.g., “RecipeVariation”) referencing the original video/recipe and user. In prisma/schema.prisma, you could add:

```prisma
model RecipeVariation {
  id             String   @id @default(dbgenerated("uuid_generate_v4()")) @db.Uuid
  userId         String   @db.Uuid
  originalVideoId String  @db.Uuid
  newTitle       String?
  newIngredients String[]
  newEquipment   String[]
  newSteps       Json
  createdAt      DateTime @default(now()) @db.Timestamptz(6)
  
  user  User  @relation(fields: [userId], references: [id], onDelete: Cascade)
  video Video @relation(fields: [originalVideoId], references: [id], onDelete: Cascade)

  @@map("recipe_variations")
  @@index([userId])
  @@index([originalVideoId])
}
```

• This table stores user-specific variations for each original recipe/video.  
• No complex version chaining is required; each variation is simply tied to the original video.

Run a Prisma migration afterward to apply these changes (for example, npx prisma migrate dev --name add_recipe_variations).

---

## 2. Service Layer for Storing Variations

Create a service file (e.g. services/recipeVariations.ts) that exports a function to insert a new variation. For instance:

```typescript
// services/recipeVariations.ts
import { prisma } from '../lib/prisma'; // Adjust path as needed

export async function storeRecipeVariation({
  userId,
  originalVideoId,
  newTitle,
  newIngredients,
  newEquipment,
  newSteps,
}: {
  userId: string;
  originalVideoId: string;
  newTitle?: string;
  newIngredients?: string[];
  newEquipment?: string[];
  newSteps?: any;
}) {
  return await prisma.recipeVariation.create({
    data: {
      userId,
      originalVideoId,
      newTitle,
      newIngredients,
      newEquipment,
      newSteps,
    },
  });
}
```

• This function can be called any time your AI-Agent or UI provides updated recipe data for the user.  
• The type definitions (e.g., newSteps?: any) can be refined as you prefer.

---

## 3. UI – “Save Variation” Integration

You can add a button in your AI chat or RecipeDetails component that, after generating a new recipe variation, calls storeRecipeVariation. For example, in RecipeChat:

```typescript
// Inside your RecipeChat component, after AI response is generated:
function handleSaveVariation() {
  // Suppose you parse newIngredients, newSteps from the AI response:
  storeRecipeVariation({
    userId: currentUserId,
    originalVideoId: recipe.id,
    newTitle: `My Variation of ${recipe.title}`,
    newIngredients: parsedIngredients,
    newEquipment: parsedEquipment,
    newSteps: parsedSteps,
  })
    .then(() => {
      // Possibly show a success message
    })
    .catch((err) => {
      console.error('Error saving variation:', err);
    });
}
```

• The best place for the “Save Variation” button is typically near where the user sees the updated, AI-generated list of ingredients/steps.  
• This approach keeps the user’s custom changes attached to the original recipe but stored separately.

---

## 4. “Back to Original Recipe” Button

Use a simple toggle to revert the UI from the “variation” state back to showing the original. In RecipeDetails, you could have:

```typescript
// Pseudocode in RecipeDetails
const [showingOriginal, setShowingOriginal] = useState(true);

function handleShowOriginal() {
  setShowingOriginal(true);
}

function handleShowVariation(myVariationData) {
  setShowingOriginal(false);
  // store the variation data locally in your component state
}

return (
  <>
    {showingOriginal ? (
      // Render the original recipe
    ) : (
      // Render variation data
    )}
    <Button title="Back to Original Recipe" onPress={handleShowOriginal} />
  </>
);
```

• Since you only wanted a single button, no complicated UI is needed.  
• This simple switch does the job: if the user has loaded or is viewing a variation, “Back to Original Recipe” resets the view.

---

## 5. Minimal Variation History (Optional)

Since you do not want a complex chain, a simple approach is to display all variations the user has saved for a given recipe. For example, in a “My Cookbook” screen—or even in the same RecipeDetails—fetch all rows from “recipe_variations” where:

• userId = currentUserId  
• originalVideoId = recipe.id

In a typical React Native/Expo component:

```typescript
// A minimal example showing all saved variations for the current recipe:
import { useEffect, useState } from 'react';
import { getRecipeVariations } from '../services/recipeVariations'; // your new fetch function

export function SavedVariations({ recipeId, userId }) {
  const [variations, setVariations] = useState([]);

  useEffect(() => {
    getRecipeVariations(recipeId, userId).then(setVariations);
  }, [recipeId, userId]);

  return (
    <View>
      <Text>My Saved Variations:</Text>
      {variations.map((variation) => (
        <TouchableOpacity
          key={variation.id}
          onPress={() => handleShowVariation(variation)}
        >
          <Text>{variation.newTitle || 'Custom Variation'}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}
```

• This list might appear in the user’s “Cookbook” or right inside your recipe detail screen.  
• Tapping on a variation calls handleShowVariation(variation), which sets your UI to load that variation in place of the original recipe data.

---

## 6. Testing & Validation

1. Run the new migration in your dev environment.  
2. Ensure the new table is created or updated (recipe_variations).  
3. Create test scenarios where you:  
   - Generate an AI-based variation.  
   - Save it.  
   - Load it successfully.  
   - Toggle “Back to Original Recipe.”  
   - Verify that none of your other code (e.g. Video, RecipeMetadata, or ShoppingList) breaks.

---

### Summary

1. Add a RecipeVariation model to your Prisma schema to store user-specific variations (one row per user + originalVideo).  
2. Create a minimal service function (storeRecipeVariation) to insert new variations.  
3. Provide a “Save Variation” button in the UI, calling the store function after receiving AI-generated changes.  
4. Add a “Back to Original Recipe” button that toggles your state from user-stored variation data back to the original.  
5. Optionally show a simple variation history by listing all user-saved variations for the current recipe inside your “Cookbook” or on the recipe details page.

This plan is clean, fits your existing codebase, and aligns with your stated preferences (single-button revert, no complicated version chains, and user-specific storage).
