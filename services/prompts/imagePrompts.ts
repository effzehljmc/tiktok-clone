import { ImageGenerationOptions } from '../imageGeneration';

// Types for different image styles
export type ImageStyle = 'photorealistic' | 'minimalistic' | 'cartoon' | 'line-art' | 'watercolor';

// Types for different image contexts
export type ImageContext = 'recipe' | 'step' | 'profile' | 'thumbnail';

interface BasePromptOptions {
  style?: ImageStyle;
  additionalContext?: string;
}

interface RecipePromptOptions extends BasePromptOptions {
  recipeName: string;
  ingredients?: string[];
  isDishPhoto?: boolean;
}

export interface StepPromptOptions {
  action: string;
  ingredients: string[];
  equipment: string[];
  style: string;
  stepNumber?: number;
  totalSteps?: number;
}

interface ProfilePromptOptions extends BasePromptOptions {
  theme?: string;
  mood?: string;
  personalityTraits?: string[];
}

interface ThumbnailPromptOptions extends BasePromptOptions {
  title: string;
  highlights?: string[];
}

// Helper function to format style instructions
function getStyleInstructions(style?: ImageStyle): string {
  switch (style) {
    case 'photorealistic':
      return 'Create a photorealistic image with natural lighting and detailed textures';
    case 'minimalistic':
      return 'Create a clean, minimalistic image with simple shapes and limited color palette';
    case 'cartoon':
      return 'Create a cartoon-style illustration with bold colors and defined outlines';
    case 'line-art':
      return 'Create a black and white line art illustration with clean, continuous lines';
    case 'watercolor':
      return 'Create a soft watercolor style image with gentle color transitions';
    default:
      return 'Create a clear and appealing image';
  }
}

// Main prompt builders for different contexts
export function buildRecipePrompt(options: RecipePromptOptions): ImageGenerationOptions {
  const {
    recipeName,
    ingredients = [],
    style,
    additionalContext = '',
    isDishPhoto = true
  } = options;

  const styleInstruction = getStyleInstructions(style);
  const ingredientsList = ingredients.length > 0 ? `with ${ingredients.join(', ')}` : '';
  
  const prompt = isDishPhoto
    ? `${styleInstruction} of a finished ${recipeName} dish ${ingredientsList}, presented on a clean plate with professional food photography lighting and composition. ${additionalContext}`
    : `${styleInstruction} showing the ingredients for ${recipeName}: ${ingredientsList}, arranged in a visually appealing way. ${additionalContext}`;

  return {
    prompt,
    width: 1024,
    height: 768
  };
}

export function buildStepPrompt({
  action,
  ingredients,
  equipment,
  style,
  stepNumber = 1,
  totalSteps = 1,
}: StepPromptOptions) {
  // Determine if this is an early, middle, or final step
  const isFirstStep = stepNumber === 1;
  const isFinalStep = stepNumber === totalSteps;
  
  // Build context about the current stage of preparation
  const stageContext = isFirstStep 
    ? "This is the beginning of the recipe - ingredients are still separate and unprepared. " 
    : isFinalStep 
    ? "This is the final step of the recipe - showing the finishing touches. "
    : "This is a middle step of the recipe - ingredients are partially combined/prepared. ";

  // Create a focused prompt for the specific action
  const actionPrompt = `Show ONLY the exact moment of ${action.toLowerCase()}. `;
  
  // Add equipment context
  const equipmentContext = equipment.length 
    ? `Using ${equipment.join(', ')}. `
    : '';

  // Build the complete prompt
  return {
    prompt: `Create a clear instructional cooking photo showing a close-up of hands ${actionPrompt}
${stageContext}
${equipmentContext}
Style: ${style}. 
Make it clear and focused on just this specific action, not the final result.
The image should be well-lit, from a helpful angle for learning the technique.
Focus on the action being performed, not the finished product.`,
    negative_prompt: "complete dish, final presentation, finished product, plated food, whole dish, text, watermark, logo, label",
    style_preset: style === 'photorealistic' ? 'photographic' : style,
    width: 1024,
    height: 1024,
  };
}

export function buildProfilePrompt(options: ProfilePromptOptions): ImageGenerationOptions {
  const {
    style = 'cartoon',
    theme = 'cooking',
    mood = 'professional',
    personalityTraits = [],
    additionalContext = ''
  } = options;

  const styleInstruction = getStyleInstructions(style);
  const traitsDescription = personalityTraits.length > 0 
    ? `expressing ${personalityTraits.join(' and ')}` 
    : '';

  const prompt = `${styleInstruction} of a ${mood} chef avatar in a ${theme} setting, ${traitsDescription}. ${additionalContext}`;

  return {
    prompt,
    width: 512,
    height: 512
  };
}

export function buildThumbnailPrompt(options: ThumbnailPromptOptions): ImageGenerationOptions {
  const {
    title,
    highlights = [],
    style = 'photorealistic',
    additionalContext = ''
  } = options;

  const styleInstruction = getStyleInstructions(style);
  const highlightsList = highlights.length > 0 
    ? `featuring ${highlights.join(', ')}` 
    : '';

  const prompt = `${styleInstruction} for a cooking video thumbnail showing ${title}, ${highlightsList}. Ensure the composition is eye-catching and social media friendly. ${additionalContext}`;

  return {
    prompt,
    width: 1280,
    height: 720 // 16:9 aspect ratio for video thumbnails
  };
}

// Example usage:
/*
const recipeImage = buildRecipePrompt({
  recipeName: 'Chocolate Cake',
  ingredients: ['dark chocolate', 'fresh berries'],
  style: 'photorealistic'
});

const stepImage = buildStepPrompt({
  action: 'kneading dough',
  equipment: ['rolling pin', 'wooden board'],
  style: 'line-art'
});

const profileImage = buildProfilePrompt({
  theme: 'pastry chef',
  mood: 'friendly',
  personalityTraits: ['creative', 'passionate'],
  style: 'cartoon'
});

const thumbnailImage = buildThumbnailPrompt({
  title: 'Ultimate Chocolate Cake',
  highlights: ['molten center', 'perfect crumb'],
  style: 'photorealistic'
});
*/ 