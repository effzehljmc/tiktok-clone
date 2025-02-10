import React, { useState } from 'react';
import { View, TextInput, Button, Image, ActivityIndicator, Text, StyleSheet, ScrollView } from 'react-native';
import { generateImage } from '../../services/imageGeneration';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { 
  buildRecipePrompt, 
  buildStepPrompt, 
  buildProfilePrompt, 
  buildThumbnailPrompt,
  ImageStyle
} from '../../services/prompts/imagePrompts';
import { Picker } from '@react-native-picker/picker';

type PromptType = 'recipe' | 'step' | 'profile' | 'thumbnail';

export function ImageGenerationTest() {
  const [promptType, setPromptType] = useState<PromptType>('recipe');
  const [style, setStyle] = useState<ImageStyle>('photorealistic');
  
  // Recipe fields
  const [recipeName, setRecipeName] = useState('');
  const [ingredients, setIngredients] = useState('');
  
  // Step fields
  const [action, setAction] = useState('');
  const [equipment, setEquipment] = useState('');
  
  // Profile fields
  const [theme, setTheme] = useState('');
  const [mood, setMood] = useState('');
  const [traits, setTraits] = useState('');
  
  // Thumbnail fields
  const [title, setTitle] = useState('');
  const [highlights, setHighlights] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    setGeneratedImage(null);

    try {
      let options;
      switch (promptType) {
        case 'recipe':
          if (!recipeName) {
            throw new Error('Please enter a recipe name');
          }
          options = buildRecipePrompt({
            recipeName,
            ingredients: ingredients.split(',').map(i => i.trim()).filter(Boolean),
            style
          });
          break;
          
        case 'step':
          if (!action) {
            throw new Error('Please enter an action');
          }
          options = buildStepPrompt({
            action,
            ingredients: ingredients.split(',').map(i => i.trim()).filter(Boolean),
            equipment: equipment.split(',').map(e => e.trim()).filter(Boolean),
            style
          });
          break;
          
        case 'profile':
          options = buildProfilePrompt({
            theme,
            mood,
            personalityTraits: traits.split(',').map(t => t.trim()).filter(Boolean),
            style
          });
          break;
          
        case 'thumbnail':
          if (!title) {
            throw new Error('Please enter a title');
          }
          options = buildThumbnailPrompt({
            title,
            highlights: highlights.split(',').map(h => h.trim()).filter(Boolean),
            style
          });
          break;
      }

      const result = await generateImage(options);

      if (result.result?.sample) {
        setGeneratedImage(result.result.sample);
      } else {
        setError('No image was generated');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate image');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Ionicons 
          name="arrow-back" 
          size={24} 
          color="black" 
          onPress={() => router.back()}
        />
        <Text style={styles.title}>Image Generation</Text>
        <View style={{ width: 24 }} />
      </View>
      
      <View style={styles.section}>
        <Text style={styles.label}>Type</Text>
        <Picker
          selectedValue={promptType}
          onValueChange={(value: PromptType) => setPromptType(value)}
          style={styles.picker}
        >
          <Picker.Item label="Recipe" value="recipe" />
          <Picker.Item label="Step" value="step" />
          <Picker.Item label="Profile" value="profile" />
          <Picker.Item label="Thumbnail" value="thumbnail" />
        </Picker>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Style</Text>
        <Picker
          selectedValue={style}
          onValueChange={(value: ImageStyle) => setStyle(value)}
          style={styles.picker}
        >
          <Picker.Item label="Photorealistic" value="photorealistic" />
          <Picker.Item label="Minimalistic" value="minimalistic" />
          <Picker.Item label="Cartoon" value="cartoon" />
          <Picker.Item label="Line Art" value="line-art" />
          <Picker.Item label="Watercolor" value="watercolor" />
        </Picker>
      </View>

      {promptType === 'recipe' && (
        <View style={styles.section}>
          <TextInput
            style={styles.input}
            value={recipeName}
            onChangeText={setRecipeName}
            placeholder="Recipe name"
          />
          <TextInput
            style={styles.input}
            value={ingredients}
            onChangeText={setIngredients}
            placeholder="Ingredients (comma separated)"
          />
        </View>
      )}

      {promptType === 'step' && (
        <View style={styles.section}>
          <TextInput
            style={styles.input}
            value={action}
            onChangeText={setAction}
            placeholder="Cooking action"
          />
          <TextInput
            style={styles.input}
            value={ingredients}
            onChangeText={setIngredients}
            placeholder="Ingredients (comma separated)"
          />
          <TextInput
            style={styles.input}
            value={equipment}
            onChangeText={setEquipment}
            placeholder="Equipment (comma separated)"
          />
        </View>
      )}

      {promptType === 'profile' && (
        <View style={styles.section}>
          <TextInput
            style={styles.input}
            value={theme}
            onChangeText={setTheme}
            placeholder="Theme (e.g., pastry chef)"
          />
          <TextInput
            style={styles.input}
            value={mood}
            onChangeText={setMood}
            placeholder="Mood (e.g., professional, friendly)"
          />
          <TextInput
            style={styles.input}
            value={traits}
            onChangeText={setTraits}
            placeholder="Personality traits (comma separated)"
          />
        </View>
      )}

      {promptType === 'thumbnail' && (
        <View style={styles.section}>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Video title"
          />
          <TextInput
            style={styles.input}
            value={highlights}
            onChangeText={setHighlights}
            placeholder="Highlights (comma separated)"
          />
        </View>
      )}

      <Button
        title={loading ? 'Generating...' : 'Generate Image'}
        onPress={handleGenerate}
        disabled={loading}
      />

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
          <Text>Generating image...</Text>
        </View>
      )}

      {error && (
        <Text style={styles.error}>{error}</Text>
      )}

      {generatedImage && (
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: generatedImage }}
            style={styles.image}
            resizeMode="contain"
          />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  section: {
    padding: 16,
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  picker: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  loadingContainer: {
    marginTop: 16,
    alignItems: 'center',
  },
  error: {
    color: 'red',
    marginTop: 16,
    padding: 16,
  },
  imageContainer: {
    margin: 16,
    aspectRatio: 1,
    width: undefined,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
}); 