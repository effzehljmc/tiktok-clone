import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { VideoCategory } from '@prisma/client';
import SearchResults from '@/components/search/SearchResults';
import { LinearGradient } from 'expo-linear-gradient';

// Shared color scheme
const COLORS = {
  background: '#000000',
  surface: '#121212',
  surfaceLight: '#1a1a1a',
  primary: '#2563eb',
  white: '#ffffff',
  whiteAlpha90: 'rgba(255,255,255,0.9)',
  whiteAlpha60: 'rgba(255,255,255,0.6)',
  whiteAlpha30: 'rgba(255,255,255,0.3)',
  whiteAlpha10: 'rgba(255,255,255,0.1)',
  whiteAlpha05: 'rgba(255,255,255,0.05)',
} as const;

// Recipe categories mapped to VideoCategory
const RECIPE_CATEGORIES = [
  VideoCategory.BREAKFAST,
  VideoCategory.LUNCH,
  VideoCategory.DINNER,
  VideoCategory.DESSERT,
  VideoCategory.SNACKS,
  VideoCategory.DRINKS,
] as const;

// Dietary preferences
const DIETARY_PREFERENCES = [
  'VEGETARIAN',
  'VEGAN',
  'GLUTEN_FREE',
  'DAIRY_FREE',
] as const;

export default function ExploreScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<VideoCategory | undefined>();
  const [selectedDiet, setSelectedDiet] = useState<typeof DIETARY_PREFERENCES[number] | undefined>();

  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  const handleCategorySelect = useCallback((category: VideoCategory) => {
    setSelectedCategory(prev => prev === category ? undefined : category);
  }, []);

  const handleDietSelect = useCallback((diet: typeof DIETARY_PREFERENCES[number]) => {
    setSelectedDiet(prev => prev === diet ? undefined : diet);
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={[COLORS.surfaceLight, COLORS.background]}
        style={styles.container}
      >
        {/* Search Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Explore</Text>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color={COLORS.whiteAlpha60} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search recipes..."
              placeholderTextColor={COLORS.whiteAlpha30}
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
              clearButtonMode="while-editing"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="off"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={handleClearSearch}>
                <Ionicons name="close-circle" size={20} color={COLORS.whiteAlpha60} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Recipe Categories */}
        <View>
          <Text style={styles.sectionTitle}>Categories</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.scrollContainer}
          >
            {RECIPE_CATEGORIES.map((category) => (
              <TouchableOpacity
                key={category}
                onPress={() => handleCategorySelect(category)}
                style={[
                  styles.categoryButton,
                  selectedCategory === category && styles.categoryButtonSelected
                ]}
              >
                <Text style={[
                  styles.categoryButtonText,
                  selectedCategory === category && styles.categoryButtonTextSelected
                ]}>
                  {category.split('_').map(word => 
                    word.charAt(0) + word.slice(1).toLowerCase()
                  ).join(' ')}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Dietary Preferences */}
        <View>
          <Text style={styles.sectionTitle}>Dietary Preferences</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.scrollContainer}
          >
            {DIETARY_PREFERENCES.map((diet) => (
              <TouchableOpacity
                key={diet}
                onPress={() => handleDietSelect(diet)}
                style={[
                  styles.categoryButton,
                  selectedDiet === diet && styles.categoryButtonSelected
                ]}
              >
                <Text style={[
                  styles.categoryButtonText,
                  selectedDiet === diet && styles.categoryButtonTextSelected
                ]}>
                  {diet.split('_').map(word => 
                    word.charAt(0) + word.slice(1).toLowerCase()
                  ).join(' ')}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Search Results or Empty State */}
        <View style={styles.resultsContainer}>
          {searchQuery.trim() || selectedCategory || selectedDiet ? (
            <SearchResults 
              query={searchQuery.trim()} 
              category={selectedCategory}
              dietaryPreference={selectedDiet}
              onClose={() => {}} // We don't need to close anything in the explore page
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="search-outline" size={48} color={COLORS.whiteAlpha30} />
              <Text style={styles.emptyTitle}>
                Search for recipes by title, description, or tags
              </Text>
              <Text style={styles.emptySubtitle}>
                Or browse by category and dietary preferences
              </Text>
            </View>
          )}
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.white,
    letterSpacing: 0.5,
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.whiteAlpha05,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: COLORS.white,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.whiteAlpha90,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  scrollContainer: {
    paddingHorizontal: 16,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginHorizontal: 4,
    borderRadius: 12,
    backgroundColor: COLORS.whiteAlpha05,
  },
  categoryButtonSelected: {
    backgroundColor: COLORS.primary,
  },
  categoryButtonText: {
    color: COLORS.whiteAlpha60,
    fontSize: 15,
    fontWeight: '500',
  },
  categoryButtonTextSelected: {
    color: COLORS.white,
  },
  resultsContainer: {
    flex: 1,
    marginTop: 16,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.whiteAlpha90,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: COLORS.whiteAlpha60,
    textAlign: 'center',
  },
}); 