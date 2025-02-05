import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { VideoCategory } from '@prisma/client';
import SearchResults from '@/components/search/SearchResults';

const SEARCH_CATEGORIES = ['MUSIC', 'GAMING', 'EDUCATION', 'ENTERTAINMENT', 'SPORTS'] as const;

export default function ExploreScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<typeof SEARCH_CATEGORIES[number] | undefined>();

  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  const handleCategorySelect = useCallback((category: typeof SEARCH_CATEGORIES[number]) => {
    setSelectedCategory(prev => prev === category ? undefined : category);
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
            placeholder="Search videos..."
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

      {/* Categories */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        className="px-4 py-2"
      >
        {SEARCH_CATEGORIES.map((category) => (
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
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Search Results or Empty State */}
      <View className="flex-1">
        {searchQuery.trim() ? (
          <SearchResults 
            query={searchQuery.trim()} 
            category={selectedCategory}
            onClose={() => {}} // We don't need to close anything in the explore page
          />
        ) : (
          <View className="flex-1 items-center justify-center p-8">
            <Ionicons name="search-outline" size={48} color="gray" />
            <Text className="text-gray-500 text-center mt-4">
              Search for videos by title, description, or tags
            </Text>
            <Text className="text-gray-400 text-center mt-2">
              Try searching for a category or topic you're interested in
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
} 