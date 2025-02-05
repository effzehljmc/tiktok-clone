"As a recipe viewer, I want to quickly scan through recipe videos to find dishes that match my cooking skill level"
Filter feed by difficulty (Beginner/Intermediate/Advanced)
Visual indicators for recipe difficulty
Quick preview of required cooking time
"As a recipe viewer, I want to filter recipes based on my dietary preferences"
Filter by dietary tags (Vegetarian, Vegan, Gluten-Free, etc.)
Clear indicators for allergens
Calorie information display
"As a recipe viewer, I want to save recipes to my personal cookbook"
Save/bookmark functionality
Organize saved recipes by cuisine type
Quick access to favorite recipes

To fully demonstrate these features, you'll need to:
Add some test recipe videos with complete metadata
Test the filtering functionality with various combinations
Verify that the recipe details modal works correctly
Implement the timestamp jumping functionality in the video player

Here’s a quick rundown of the “recipe viewer” user stories from checklist/recipes.md, how they compare to what’s already in place, and what still needs to be addressed:

--------------------------------------------------------------------------------
## 1. Quick Scan by Cooking Skill Level
• “Filter feed by difficulty (Beginner/Intermediate/Advanced)”  
• “Visual indicators for recipe difficulty”  
• “Quick preview of required cooking time”

Currently, the codebase shows a generic video list (for example, in app/creator-profile.tsx and various other screens). There is no mention or storage of “difficulty” or “cooking time” in the “videos” or “User” table. To support this story, you’ll need:  
1. A way to store difficulty levels (e.g., “Beginner,” “Intermediate,” “Advanced”) for each recipe video.  
2. A field for the estimated cooking time.  
3. Query or filter logic (e.g., supabase.from('videos').select(...).eq('difficulty', 'Beginner')) to show only the relevant items.  
4. UI elements (visual badges, text displays) that let viewers quickly see difficulty and time.

--------------------------------------------------------------------------------
## 2. Filter Based on Dietary Preferences
• “Filter by dietary tags (Vegetarian, Vegan, Gluten-Free, etc.)”  
• “Clear indicators for allergens”  
• “Calorie information display”

Again, the existing code references a general “videos” table with fields like “id,” “thumbnail_url,” and “video_url,” but no dedicated fields for dietary tags or allergens. Implementing this user story would require:  
1. An additional column (e.g., "dietary_tags") that might be a string array or a related table for tags like ["Vegetarian", "Gluten-Free"].  
2. Possibly a second column (e.g., "allergens") or another approach to storing allergen info.  
3. A numeric field for calorie count.  
4. Filter UI in your feed screen to let the user pick from these tags.  
5. A way to display these tags in the UI (e.g., little badges or text elements).

--------------------------------------------------------------------------------
## 3. Save Recipes to a Personal Cookbook
• “Save/bookmark functionality”  
• “Organize saved recipes by cuisine type”  
• “Quick access to favorite recipes”

Currently, user account creation and sign-in flows are implemented, but there’s no mention of a “bookmarks” or “favorites” table. You would need:  
1. A join table or separate table (for example, “favorites” or “bookmarks”) that tracks (user_id, video_id).  
2. UI for the user to tap a “Save” or “Bookmark” button.  
3. A “Saved Recipes” screen or a “cookbook” screen that lists the user’s saved videos, possibly sorted by cuisine or category.  
4. A query to load that user’s saved videos from the database (e.g., supabase.from('favorites').eq('user_id', currentUser.id) ...).

--------------------------------------------------------------------------------
## Additional Considerations
1. You’ll need to add columns or tables to store all this new metadata (difficulty, cooking time, dietary tags, allergens, calorie info, cuisine type, etc.).  
2. Incorporate new UI elements (dropdown filters, badges, or toggles) so that viewers can filter or see these indicators.  
3. Test the flow end-to-end: creating or editing a recipe video, assigning those attributes, then verifying that filtering and bookmarking work as intended.

--------------------------------------------------------------------------------
### Summary of What’s Missing
• No difficulty-level field implementation.  
• No cooking-time or other recipe metadata fields.  
• No dietary/allergen tags in the “videos” table (or a related table).  
• No existing bookmark/favorites logic.  

By adding these fields/tables and building out filtering and bookmarking flows in your UI, you can cover the three user stories in checklist/recipes.md. That will align your current functionality (basic video listing, user auth, user profile) with the desired “recipe viewer” experience.
