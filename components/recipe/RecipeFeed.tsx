import React from 'react';
import { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, ScrollView, Modal, ActivityIndicator } from 'react-native';
import { VideoFeed } from '../video/VideoFeed';
import { useVideos, Video } from '@/hooks/useVideos';
import { VideoCategory } from '@prisma/client';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { SaveButton } from './SaveButton';
import { useShoppingList } from '@/hooks/useShoppingList';
import Toast from 'react-native-toast-message';

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
  videos: Video[];
  showSearchIcon?: boolean;
  renderVideoOverlay?: (video: RecipeVideo) => React.ReactNode;
}

interface RecipeDetailsProps {
  recipe: RecipeMetadata;
  onClose: () => void;
}

const FOOD_CATEGORIES = ['DESSERT', 'DINNER', 'BREAKFAST', 'SNACKS'] as VideoCategory[];

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
    top: 100,
    right: 16,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: 'rgba(0,0,0,0.7)',
    zIndex: 1,
  },
  difficultyText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    width: '100%',
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  modalActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
  },
  saveButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    marginTop: 24,
    color: '#1a1a1a',
  },
  ingredientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  bulletPoint: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#007AFF',
    marginRight: 12,
  },
  ingredientText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  stepNumberText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  stepContent: {
    flex: 1,
  },
  stepDescription: {
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
  },
  scrollContent: {
    padding: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
  },
});

export function RecipeFeed() {
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel | null>(null);
  const [selectedDiet, setSelectedDiet] = useState<DietaryPreference | null>(null);
  const [showRecipeDetails, setShowRecipeDetails] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<RecipeVideo | null>(null);
  const router = useRouter();
  const { user } = useAuth();
  const { addToList, isAdding } = useShoppingList(user?.id || '');

  const { data: videos, isLoading } = useVideos({
    categories: FOOD_CATEGORIES,
    difficulty: selectedDifficulty ?? undefined,
    dietaryTag: selectedDiet ?? undefined,
  });

  if (isLoading || !videos) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

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

  const RecipeDetails = ({ recipe, onClose }: RecipeDetailsProps) => {
    const handleAddToShoppingList = async () => {
      if (!user) return;
      
      try {
        await addToList(
          recipe.ingredients.map(ingredient => ({
            ingredient,
            recipe_id: selectedVideo?.id
          }))
        );
        Toast.show({
          type: 'success',
          text1: 'Added to shopping list',
          text2: 'All ingredients have been added to your shopping list'
        });
      } catch (error) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Failed to add ingredients to shopping list'
        });
      }
    };

    return (
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
              <View style={styles.modalActions}>
                {user && selectedVideo && (
                  <>
                    <TouchableOpacity 
                      style={styles.actionButton}
                      onPress={handleAddToShoppingList}
                      disabled={isAdding}
                    >
                      <Ionicons 
                        name="cart-outline" 
                        size={24} 
                        color={isAdding ? "#999" : "#666"} 
                      />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.saveButton}>
                      <SaveButton
                        videoId={selectedVideo.id}
                        userId={user.id}
                        size={24}
                      />
                    </TouchableOpacity>
                  </>
                )}
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
              <Text style={styles.sectionTitle}>Ingredients</Text>
              {recipe.ingredients.map((ingredient, index) => (
                <View key={index} style={styles.ingredientItem}>
                  <View style={styles.bulletPoint} />
                  <Text style={styles.ingredientText}>{ingredient}</Text>
                </View>
              ))}

              <Text style={styles.sectionTitle}>Equipment Needed</Text>
              {recipe.equipment.map((item, index) => (
                <View key={index} style={styles.ingredientItem}>
                  <View style={styles.bulletPoint} />
                  <Text style={styles.ingredientText}>{item}</Text>
                </View>
              ))}

              <Text style={styles.sectionTitle}>Steps</Text>
              {recipe.steps.map((step, index) => (
                <View key={index} style={styles.stepItem}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>{index + 1}</Text>
                  </View>
                  <View style={styles.stepContent}>
                    <Text style={styles.stepDescription}>{step.description}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.filtersContainer}>
        <DifficultyFilter />
        <DietaryFilter />
      </View>
      <VideoFeed
        videos={videos}
        showSearchIcon={false}
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
        />
      )}
    </View>
  );
} 