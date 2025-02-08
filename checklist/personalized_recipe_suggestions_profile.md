Below is a concise, step-by-step plan for implementing the personalized recipe suggestions in your Profile tab. It draws on the logic and examples from “@personalized_recipe_suggestions.md” (the file you shared). Where relevant, code snippets are shown without line numbers.

---

## 1. Define a Model for User Preferences (If Not Already Done)

In your prisma/schema.prisma (or equivalent), create or confirm a model like UserProfile to store user preferences (e.g., dietTags, disliked ingredients). Example:

```prisma
model UserProfile {
  id         String   @id @default(dbgenerated("uuid_generate_v4()")) @db.Uuid
  userId     String   @unique
  dietTags   String[]
  disliked   String[]
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  user       User     @relation(fields: [userId], references: [id])
  @@map("user_profile")
}
```

After editing schema.prisma, run your migration (for example, using npx prisma migrate dev --name add_user_profile).

---

## 2. Create User Preferences Service

Create a file, for example services/userPreferences.ts, and add two main functions:  
1. updateUserPreferences(userId: string, prefs: Preferences)  
2. getUserPreferences(userId: string)

Here’s a minimal example:

```typescript:services/userPreferences.ts
import { prisma } from '../lib/prisma';

interface Preferences {
  dietTags?: string[];
  disliked?: string[];
}

export async function updateUserPreferences(userId: string, prefs: Preferences) {
  return prisma.userProfile.upsert({
    where: { userId },
    update: {
      dietTags: prefs.dietTags ?? [],
      disliked: prefs.disliked ?? [],
    },
    create: {
      userId,
      dietTags: prefs.dietTags ?? [],
      disliked: prefs.disliked ?? [],
    },
  });
}

export async function getUserPreferences(userId: string) {
  const profile = await prisma.userProfile.findUnique({
    where: { userId },
  });
  return {
    dietTags: profile?.dietTags ?? [],
    disliked: profile?.disliked ?? [],
  };
}
```

---

## 3. Create or Extend Your Recommendation Service

In services/recipeRecommendations.ts (shown in the snippet from “@personalized_recipe_suggestions.md”), you already have an example getPersonalizedRecommendations(userId: string). Make sure it uses the new getUserPreferences() for filtering or ranking logic:

```typescript:services/recipeRecommendations.ts
import { prisma } from '../lib/prisma';
import { getUserPreferences } from './userPreferences';
import { getUserHistory } from './userHistory'; // optional

export async function getPersonalizedRecommendations(userId: string) {
  const preferences = await getUserPreferences(userId);

  // (Optional) retrieve user activity
  // const userHistory = await getUserHistory(userId);

  const recommendedRecipes = await prisma.video.findMany({
    where: {
      // Example: only categories matching user’s dietTags or other logic
      category: { in: preferences.dietTags },
      // or exclude disliked tags/ingredients, etc.
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 10,
  });

  return recommendedRecipes;
}
```

---

## 4. Add a UI for Updating Preferences in the Profile Tab

In your Profile tab screen (for instance, app/(tabs)/profile.tsx), add a section where users can set or update their preferences. Simplify as needed:

```typescript:app/(tabs)/profile.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, Button, TextInput } from 'react-native';
import { updateUserPreferences, getUserPreferences } from '@/services/userPreferences';

export function ProfileScreen({ userId }: { userId: string }) {
  const [dietTags, setDietTags] = useState('');
  const [disliked, setDisliked] = useState('');

  useEffect(() => {
    async function fetchPrefs() {
      const prefs = await getUserPreferences(userId);
      setDietTags(prefs.dietTags.join(', '));
      setDisliked(prefs.disliked.join(', '));
    }
    fetchPrefs();
  }, [userId]);

  async function handleSave() {
    await updateUserPreferences(userId, {
      dietTags: dietTags.split(',').map((x) => x.trim()),
      disliked: disliked.split(',').map((x) => x.trim()),
    });
    // Possibly show a toast or success message
  }

  return (
    <View>
      <Text>Preferences</Text>
      <Text>Diet Tags (comma-separated)</Text>
      <TextInput
        value={dietTags}
        onChangeText={setDietTags}
        placeholder="e.g. vegetarian, gluten_free"
      />
      <Text>Disliked Ingredients (comma-separated)</Text>
      <TextInput
        value={disliked}
        onChangeText={setDisliked}
        placeholder="e.g. tomato, peanuts"
      />
      <Button title="Save Preferences" onPress={handleSave} />
    </View>
  );
}
```

When the user clicks “Save Preferences,” the preferences are updated in your DB.

---

## 5. Integrate Personalized Recommendations in the Same Profile Tab

Now that you can store user preferences, you can also show recommended recipes in the Profile tab. For example, add a small “Recommended Recipes” section below the preferences form:

```typescript:app/(tabs)/profile.tsx
import { getPersonalizedRecommendations } from '@/services/recipeRecommendations';

export function ProfileScreen({ userId }: { userId: string }) {
  const [recommendations, setRecommendations] = useState([]);

  async function fetchRecommendations() {
    const recs = await getPersonalizedRecommendations(userId);
    setRecommendations(recs);
  }

  useEffect(() => {
    fetchRecommendations();
  }, [userId]);

  // ... rest of the preferences UI above ...
  
  return (
    <ScrollView>
      {/* existing preference form UI here */}

      <Text>Recommended For You</Text>
      {recommendations.map((recipe) => (
        <Text key={recipe.id}>{recipe.title}</Text>
      ))}
    </ScrollView>
  );
}
```

You can refresh or re-fetch the recommendations after the user updates preferences, so the feed is always in sync.

---

## 6. Connect the AI-Agent Interactions (Optional)

If you want the feed to factor in AI-agent usage (e.g., the user frequently requests vegan variations), you can:

1. Track usage in a recipeVariation or userActivity table.  
2. Add a getUserHistory(userId) in services/userHistory.ts that returns usage stats (e.g., {veganCount: 5, sugarFree: 2}).  
3. Incorporate those stats in getPersonalizedRecommendations for weighting or filtering.

Example:

```typescript
import { getUserHistory } from './userHistory';

export async function getPersonalizedRecommendations(userId: string) {
  const preferences = await getUserPreferences(userId);
  const userHistory = await getUserHistory(userId);

  // Combine logic from preferences and history
  // For instance, prioritize vegan recipes if userHistory.veganCount > 3
  // ...
  return recommendedRecipes;
}
```

---

## 7. Test the Changes

1. Create or migrate your database to ensure UserProfile (and recipe variations, if desired) is present.  
2. Open the Profile screen, set some preferences (e.g., “vegan, gluten_free”).  
3. Check that your recommender system returns appropriate recipes in the “Recommended For You” section.  
4. Modify the preferences, confirm the feed updates accordingly.  
5. (Optional) Make sure AI-agent usage logs feed into your user history or preferences, and that your feed respects that data.

---

## 8. Reference in @personalized_recipe_suggestions.md

Finally, update or cross-reference the snippet in “@personalized_recipe_suggestions.md” to mention how the Profile tab integrates with the new personalized feed approach. For instance, you might add:

“In addition to the dedicated PersonalizedFeed component, we have integrated the recommendation logic directly into the user’s Profile tab. Users can configure their dietTags and disliked ingredients, and the system displays relevant suggestions immediately. See services/userPreferences.ts and services/recipeRecommendations.ts for details.”

---

### Final Summary

1. Add or confirm a UserProfile schema for storing self-declared preferences.  
2. Implement updateUserPreferences and getUserPreferences in services/userPreferences.ts.  
3. Refine getPersonalizedRecommendations in services/recipeRecommendations.ts to filter or rank based on user preferences.  
4. In the Profile tab (ProfileScreen), display a small form to edit dietTags and disliked ingredients.  
5. Also in the Profile tab, fetch personalized recommendations and display them.  
6. (Optional) Incorporate AI usage data or advanced weighting.  
7. Update “@personalized_recipe_suggestions.md” to reflect these changes.

By following these steps, you’ll have a simple but effective personalized feed integrated right into the user’s Profile tab, leveraging your existing agent logic and data models.
