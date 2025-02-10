import { supabase } from '@/utils/supabase';

interface StepIllustration {
  id: string;
  recipe_id: string;
  step_index: number;
  image_url: string;
  created_at: string;
}

export async function saveStepIllustration(
  recipeId: string,
  stepIndex: number,
  imageUrl: string
): Promise<StepIllustration> {
  const { data, error } = await supabase
    .from('step_illustrations')
    .upsert({
      recipe_id: recipeId,
      step_index: stepIndex,
      image_url: imageUrl,
    }, {
      onConflict: 'recipe_id,step_index'
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getStepIllustrations(recipeId: string): Promise<StepIllustration[]> {
  const { data, error } = await supabase
    .from('step_illustrations')
    .select('*')
    .eq('recipe_id', recipeId)
    .order('step_index');

  if (error) throw error;
  return data || [];
}

export async function deleteStepIllustration(id: string): Promise<void> {
  const { error } = await supabase
    .from('step_illustrations')
    .delete()
    .eq('id', id);

  if (error) throw error;
} 