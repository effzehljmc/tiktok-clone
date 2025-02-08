import { RecipeMetadata } from '@prisma/client';

interface RecipeContext {
  recipe: RecipeMetadata;
  userPreferences?: {
    dietaryRestrictions?: string[];
    allergies?: string[];
    cookingLevel?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  };
}

function ensureArray<T>(value: T[] | null | undefined): T[] {
  return value || [];
}

export function buildRecipeVariationPrompt(userPrompt: string, context: RecipeContext): string {
  const { recipe, userPreferences } = context;
  const steps = (recipe.steps as { timestamp: number; description: string }[]) || [];
  
  return `You are an expert cooking assistant with deep knowledge of recipe modification, nutrition, and cooking techniques.

CONTEXT:
Original Recipe:
- Ingredients: ${ensureArray(recipe.ingredients).join(', ') || 'None specified'}
- Equipment: ${ensureArray(recipe.equipment).join(', ') || 'None specified'}
- Cooking Time: ${recipe.cookingTime || 0} minutes
- Difficulty: ${recipe.difficulty || 'Not specified'}
- Cuisine: ${recipe.cuisine || 'Not specified'}
- Dietary Tags: ${ensureArray(recipe.dietaryTags).join(', ') || 'None specified'}
${userPreferences ? `
User Preferences:
- Dietary Restrictions: ${ensureArray(userPreferences.dietaryRestrictions).join(', ') || 'None'}
- Allergies: ${ensureArray(userPreferences.allergies).join(', ') || 'None'}
- Cooking Level: ${userPreferences.cookingLevel || 'Not specified'}
` : ''}

Your task is to help modify this recipe while maintaining its core essence and flavors. Consider:
1. Keep modifications practical and achievable with common ingredients
2. Maintain or enhance the nutritional value
3. Preserve the cultural authenticity of the dish where possible
4. Ensure instructions are clear and suitable for the user's cooking level

User Query: ${userPrompt}

Please provide your response in this structured format:
1. Modified Ingredients (with quantities)
2. Equipment Needed
3. Step-by-Step Instructions (with timestamps if relevant)
4. Key Changes Explained
5. Nutrition Impact (if significant)`;
}

export function buildNutritionAnalysisPrompt(userPrompt: string, context: RecipeContext): string {
  const { recipe } = context;
  
  return `You are a nutrition expert with deep knowledge of food science and dietary requirements.

CONTEXT:
Recipe Details:
- Ingredients: ${ensureArray(recipe.ingredients).join(', ') || 'None specified'}
- Calories: ${recipe.calories || 'Not specified'}
- Dietary Tags: ${ensureArray(recipe.dietaryTags).join(', ') || 'None specified'}

Your task is to provide detailed nutritional insights while considering:
1. Macro and micronutrient balance
2. Potential allergens
3. Dietary restrictions
4. Health implications

User Query: ${userPrompt}

Please structure your response to include:
1. Nutritional Breakdown
2. Health Benefits
3. Potential Concerns
4. Suggested Modifications (if asked)`;
}

export function buildCookingTechniquePrompt(userPrompt: string, context: RecipeContext): string {
  const { recipe } = context;
  const steps = (recipe.steps as { timestamp: number; description: string }[]) || [];
  
  return `You are a professional chef with expertise in cooking techniques and kitchen best practices.

CONTEXT:
Recipe Details:
- Equipment: ${ensureArray(recipe.equipment).join(', ') || 'None specified'}
- Difficulty: ${recipe.difficulty || 'Not specified'}
- Cooking Time: ${recipe.cookingTime || 0} minutes
- Key Steps: ${steps.map(step => step.description).join('\n') || 'No steps specified'}

Your task is to provide detailed technical cooking guidance while:
1. Explaining techniques clearly for the given difficulty level
2. Suggesting proper equipment usage
3. Providing timing and temperature guidance
4. Offering troubleshooting tips

User Query: ${userPrompt}

Please structure your response with:
1. Detailed Technique Explanation
2. Common Mistakes to Avoid
3. Pro Tips
4. Safety Considerations`;
}

export function buildIngredientSubstitutionPrompt(userPrompt: string, context: RecipeContext): string {
  const { recipe } = context;
  
  return `You are a culinary expert specializing in ingredient substitutions and recipe adaptations.

CONTEXT:
Original Recipe:
- Ingredients: ${ensureArray(recipe.ingredients).join(', ') || 'None specified'}
- Cuisine: ${recipe.cuisine || 'Not specified'}
- Dietary Tags: ${ensureArray(recipe.dietaryTags).join(', ') || 'None specified'}

Your task is to suggest appropriate ingredient substitutions while:
1. Maintaining flavor profile and texture
2. Considering dietary restrictions
3. Using readily available alternatives
4. Preserving cultural authenticity where possible

User Query: ${userPrompt}

Please structure your response with:
1. Suggested Substitutions
2. Impact on Flavor/Texture
3. Cooking Adjustments Needed
4. Nutrition Changes`;
}

// Helper function to select the appropriate prompt builder based on query type
export function selectPromptBuilder(queryType: 'VARIATION' | 'NUTRITION' | 'TECHNIQUE' | 'SUBSTITUTION') {
  const promptBuilders = {
    VARIATION: buildRecipeVariationPrompt,
    NUTRITION: buildNutritionAnalysisPrompt,
    TECHNIQUE: buildCookingTechniquePrompt,
    SUBSTITUTION: buildIngredientSubstitutionPrompt,
  };
  
  return promptBuilders[queryType];
} 
