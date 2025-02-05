import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { VideoCategory } from '@prisma/client';
import SearchResults from '@/components/search/SearchResults';

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
    <SafeAreaView style={{ flex: 1 }} className="bg-white">
      {/* Search Header */}
      <View className="px-4 pt-2 pb-0">
        <Text className="text-2xl font-bold mb-4">Explore</Text>
        <View className="flex-row items-center bg-gray-100 rounded-full px-4 py-2 mb-2">
          <Ionicons name="search" size={20} color="gray" />
          <TextInput
            className="flex-1 ml-2 text-base"
            placeholder="Search recipes..."
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
              <Ionicons name="close-circle" size={20} color="gray" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Recipe Categories */}
      <View>
        <Text className="px-4 py-2 text-base font-semibold text-gray-600">Categories</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          className="px-4 py-2"
        >
          {RECIPE_CATEGORIES.map((category) => (
            <TouchableOpacity
              key={category}
              onPress={() => handleCategorySelect(category)}
              className={`px-4 py-2 mr-2 rounded-full ${
                selectedCategory === category 
                  ? 'bg-black' 
                  : 'bg-gray-100'
              }`}
            >
              <Text className={`${
                selectedCategory === category 
                  ? 'text-white' 
                  : 'text-gray-600'
              }`}>
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
        <Text className="px-4 py-2 text-base font-semibold text-gray-600">Dietary Preferences</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          className="px-4 py-2"
        >
          {DIETARY_PREFERENCES.map((diet) => (
            <TouchableOpacity
              key={diet}
              onPress={() => handleDietSelect(diet)}
              className={`px-4 py-2 mr-2 rounded-full ${
                selectedDiet === diet 
                  ? 'bg-black' 
                  : 'bg-gray-100'
              }`}
            >
              <Text className={`${
                selectedDiet === diet 
                  ? 'text-white' 
                  : 'text-gray-600'
              }`}>
                {diet.split('_').map(word => 
                  word.charAt(0) + word.slice(1).toLowerCase()
                ).join(' ')}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Search Results or Empty State */}
      <View className="flex-1">
        {searchQuery.trim() || selectedCategory || selectedDiet ? (
          <SearchResults 
            query={searchQuery.trim()} 
            category={selectedCategory}
            dietaryPreference={selectedDiet}
            onClose={() => {}} // We don't need to close anything in the explore page
          />
        ) : (
          <View className="flex-1 items-center justify-center p-8">
            <Ionicons name="search-outline" size={48} color="gray" />
            <Text className="text-gray-500 text-center mt-4">
              Search for recipes by title, description, or tags
            </Text>
            <Text className="text-gray-400 text-center mt-2">
              Or browse by category and dietary preferences
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
} 