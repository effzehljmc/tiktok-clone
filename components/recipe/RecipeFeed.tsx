import React from 'react';
import { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, ScrollView, Modal } from 'react-native';
import { VideoFeed } from '../video/VideoFeed';
import { useVideos, Video } from '@/hooks/useVideos';
import { VideoCategory } from '@prisma/client';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

type DifficultyLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
type DietaryPreference = 'VEGETARIAN' | 'VEGAN' | 'GLUTEN_FREE' | 'DAIRY_FREE';

interface RecipeMetadata {
  cookingTime: number;
  difficulty: DifficultyLevel;
  servings: number;
  calories?: number;
  dietaryTags: DietaryPreference[];
  ingredients: string[];
  steps: { timestamp: number; description: string }[];
  equipment: string[];
  cuisine: string;
}

interface RecipeVideo extends Omit<Video, 'recipeMetadata'> {
  recipeMetadata?: RecipeMetadata;
}

interface RecipeInfoProps {
  recipe: RecipeMetadata;
}

interface VideoFeedProps {
  category?: VideoCategory;
  renderVideoOverlay?: (video: RecipeVideo) => React.ReactNode;
}

interface RecipeDetailsProps {
  recipe: RecipeMetadata;
  onClose: () => void;
  onJumpToStep: (timestamp: number) => void;
}

const COOKING_CATEGORY = 'COOKING' as VideoCategory;

export function RecipeFeed() {
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel | null>(null);
  const [selectedDiet, setSelectedDiet] = useState<DietaryPreference | null>(null);
  const [showRecipeDetails, setShowRecipeDetails] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<RecipeVideo | null>(null);
  const router = useRouter();

  const { data: videos } = useVideos({
    category: COOKING_CATEGORY,
    difficulty: selectedDifficulty ?? undefined,
    dietaryTag: selectedDiet ?? undefined,
  });

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    filtersContainer: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      backgroundColor: '#fff',
      borderBottomWidth: 1,
      borderBottomColor: '#eee',
    },
    filterRow: {
      flexDirection: 'row',
      marginBottom: 8,
    },
    filterButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      marginRight: 8,
      backgroundColor: '#f0f0f0',
    },
    filterButtonSelected: {
      backgroundColor: '#007AFF',
    },
    filterText: {
      fontSize: 14,
      color: '#333',
    },
    filterTextSelected: {
      color: '#fff',
    },
    infoContainer: {
      position: 'absolute',
      bottom: 120,
      left: 16,
      right: 16,
      backgroundColor: 'rgba(0,0,0,0.7)',
      borderRadius: 8,
      padding: 12,
    },
    infoText: {
      color: '#fff',
      fontSize: 14,
      marginBottom: 4,
    },
    difficultyBadge: {
      position: 'absolute',
      top: 16,
      right: 16,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 4,
      backgroundColor: 'rgba(0,0,0,0.7)',
    },
    difficultyText: {
      color: '#fff',
      fontSize: 12,
      fontWeight: 'bold',
    },
    modalContainer: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
      backgroundColor: 'white',
      padding: 20,
      borderRadius: 20,
      width: '80%',
      alignSelf: 'center',
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: 'bold',
    },
    closeButton: {
      padding: 10,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      marginBottom: 10,
    },
    ingredientItem: {
      marginBottom: 5,
    },
    stepItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 10,
    },
    stepNumber: {
      fontWeight: 'bold',
      marginRight: 10,
    },
    stepDescription: {
      flex: 1,
    },
    jumpButton: {
      padding: 10,
      backgroundColor: '#007AFF',
      borderRadius: 5,
    },
    jumpButtonText: {
      color: 'white',
      fontWeight: 'bold',
    },
  });

  const DifficultyFilter = () => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
      {(['BEGINNER', 'INTERMEDIATE', 'ADVANCED'] as DifficultyLevel[]).map((difficulty) => (
        <TouchableOpacity
          key={difficulty}
          style={[
            styles.filterButton,
            selectedDifficulty === difficulty && styles.filterButtonSelected,
          ]}
          onPress={() => setSelectedDifficulty(
            selectedDifficulty === difficulty ? null : difficulty
          )}
        >
          <Text
            style={[
              styles.filterText,
              selectedDifficulty === difficulty && styles.filterTextSelected,
            ]}
          >
            {difficulty.charAt(0) + difficulty.slice(1).toLowerCase()}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const DietaryFilter = () => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
      {(['VEGETARIAN', 'VEGAN', 'GLUTEN_FREE', 'DAIRY_FREE'] as DietaryPreference[]).map((diet) => (
        <TouchableOpacity
          key={diet}
          style={[
            styles.filterButton,
            selectedDiet === diet && styles.filterButtonSelected,
          ]}
          onPress={() => setSelectedDiet(
            selectedDiet === diet ? null : diet
          )}
        >
          <Text
            style={[
              styles.filterText,
              selectedDiet === diet && styles.filterTextSelected,
            ]}
          >
            {diet.split('_').map(word => 
              word.charAt(0) + word.slice(1).toLowerCase()
            ).join(' ')}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const RecipeInfo = ({ video }: { video: RecipeVideo }) => {
    if (!video.recipeMetadata) return null;
    
    return (
      <TouchableOpacity 
        style={styles.infoContainer}
        onPress={() => {
          setSelectedVideo(video);
          setShowRecipeDetails(true);
        }}
      >
        <Text style={styles.infoText}>
          <Ionicons name="time-outline" size={16} /> {video.recipeMetadata.cookingTime} mins
        </Text>
        <Text style={styles.infoText}>
          <Ionicons name="restaurant-outline" size={16} /> {video.recipeMetadata.servings} servings
        </Text>
        {video.recipeMetadata.calories && (
          <Text style={styles.infoText}>
            <Ionicons name="flame-outline" size={16} /> {video.recipeMetadata.calories} cal
          </Text>
        )}
        <Text style={styles.infoText}>
          <Ionicons name="restaurant-outline" size={16} /> {video.recipeMetadata.cuisine}
        </Text>
        <Text style={[styles.infoText, { fontSize: 12 }]}>
          Tap for recipe details
        </Text>
      </TouchableOpacity>
    );
  };

  const RecipeDetails = ({ recipe, onClose, onJumpToStep }: RecipeDetailsProps) => (
    <Modal
      visible={showRecipeDetails}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Recipe Details</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} />
            </TouchableOpacity>
          </View>

          <ScrollView>
            <Text style={styles.sectionTitle}>Ingredients</Text>
            {recipe.ingredients.map((ingredient, index) => (
              <Text key={index} style={styles.ingredientItem}>
                • {ingredient}
              </Text>
            ))}

            <Text style={styles.sectionTitle}>Equipment Needed</Text>
            {recipe.equipment.map((item, index) => (
              <Text key={index} style={styles.ingredientItem}>
                • {item}
              </Text>
            ))}

            <Text style={styles.sectionTitle}>Steps</Text>
            {recipe.steps.map((step, index) => (
              <View key={index} style={styles.stepItem}>
                <Text style={styles.stepNumber}>{index + 1}.</Text>
                <Text style={styles.stepDescription}>{step.description}</Text>
                <TouchableOpacity
                  style={styles.jumpButton}
                  onPress={() => {
                    onJumpToStep(step.timestamp);
                    onClose();
                  }}
                >
                  <Text style={styles.jumpButtonText}>Jump to Step</Text>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <View style={styles.filtersContainer}>
        <DifficultyFilter />
        <DietaryFilter />
      </View>
      <VideoFeed
        category={COOKING_CATEGORY}
        renderVideoOverlay={(video: Video) => {
          const recipeVideo = video as RecipeVideo;
          return (
            <>
              <View style={styles.difficultyBadge}>
                <Text style={styles.difficultyText}>
                  {recipeVideo.recipeMetadata?.difficulty || 'BEGINNER'}
                </Text>
              </View>
              <RecipeInfo video={recipeVideo} />
            </>
          );
        }}
      />
      {selectedVideo?.recipeMetadata && (
        <RecipeDetails
          recipe={selectedVideo.recipeMetadata}
          onClose={() => {
            setShowRecipeDetails(false);
            setSelectedVideo(null);
          }}
          onJumpToStep={(timestamp) => {
            // TODO: Implement jumping to specific timestamp in video
            console.log('Jump to timestamp:', timestamp);
          }}
        />
      )}
    </View>
  );
} 