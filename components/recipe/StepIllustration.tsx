import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { safeGenerateImage } from '@/services/safeImageGeneration';
import { buildStepPrompt } from '@/services/prompts/imagePrompts';
import { saveStepIllustration, getStepIllustrations } from '@/services/stepIllustrations';
import { useAuth } from '@/hooks/useAuth';

interface StepIllustrationProps {
  step: {
    description: string;
    timestamp: number;
  };
  ingredients: string[];
  equipment: string[];
  recipeId: string;
  stepIndex: number;
}

export function StepIllustration({ 
  step, 
  ingredients = [], 
  equipment = [], 
  recipeId,
  stepIndex 
}: StepIllustrationProps) {
  const { user } = useAuth();
  const [image, setImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load saved illustration on mount
  useEffect(() => {
    async function loadIllustration() {
      try {
        const illustrations = await getStepIllustrations(recipeId);
        const savedIllustration = illustrations.find(i => i.step_index === stepIndex);
        if (savedIllustration) {
          setImage(savedIllustration.image_url);
        }
      } catch (err) {
        console.error('Failed to load illustration:', err);
      }
    }
    loadIllustration();
  }, [recipeId, stepIndex]);

  async function handleGenerateImage() {
    if (isLoading) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const options = buildStepPrompt({
        action: step.description,
        ingredients,
        equipment,
        style: user?.illustration_style || 'photorealistic'
      });
      
      const result = await safeGenerateImage(options);
      
      if (result.result?.sample) {
        const imageUrl = result.result.sample;
        // Save the illustration
        await saveStepIllustration(recipeId, stepIndex, imageUrl);
        setImage(imageUrl);
      } else {
        setError('Failed to generate image');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate image');
    } finally {
      setIsLoading(false);
    }
  }

  if (!image && !isLoading) {
    return (
      <TouchableOpacity 
        onPress={handleGenerateImage}
        style={styles.generateButton}
        disabled={isLoading}
      >
        <Ionicons name="image-outline" size={24} color="white" />
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#3b82f6" />
        </View>
      ) : image ? (
        <Image
          source={image}
          style={styles.image}
          contentFit="cover"
          transition={200}
        />
      ) : null}
      
      {error && (
        <TouchableOpacity 
          onPress={handleGenerateImage}
          style={[styles.generateButton, styles.errorButton]}
        >
          <Ionicons name="refresh" size={24} color="white" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 120,
    height: 120,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#1f2937',
    marginRight: 16,
  },
  generateButton: {
    width: '100%',
    height: '100%',
    backgroundColor: '#374151',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorButton: {
    backgroundColor: '#991b1b',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
}); 