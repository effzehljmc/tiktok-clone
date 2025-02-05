import React from 'react';
import { View, TextInput, TouchableOpacity, Keyboard, Pressable, Platform, ScrollView, Text, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState, useCallback, useEffect, useRef } from 'react';
import SearchResults from './search/SearchResults';

// Custom debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

interface SearchOverlayProps {
  isVisible: boolean;
  onClose: () => void;
}

const SEARCH_CATEGORIES = ['MUSIC', 'GAMING', 'EDUCATION', 'ENTERTAINMENT', 'SPORTS'] as const;
const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function SearchOverlay({ isVisible, onClose }: SearchOverlayProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<typeof SEARCH_CATEGORIES[number] | undefined>();
  const searchInputRef = useRef<TextInput>(null);
  
  // Use our custom debounce hook
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Effect to handle debounced search
  useEffect(() => {
    const trimmedQuery = debouncedSearchQuery.trim();
    if (trimmedQuery.length > 0) {
      console.log('Setting isSearching to true for query:', trimmedQuery);
      setIsSearching(true);
    } else {
      console.log('Setting isSearching to false (empty query)');
      setIsSearching(false);
    }
  }, [debouncedSearchQuery]);

  // Reset state when overlay is closed
  useEffect(() => {
    if (!isVisible) {
      setSearchQuery('');
      setIsSearching(false);
      setSelectedCategory(undefined);
      Keyboard.dismiss();
    } else {
      // Focus the input when overlay becomes visible
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [isVisible]);

  const handleSearch = useCallback(() => {
    const trimmedQuery = searchQuery.trim();
    if (trimmedQuery) {
      console.log('Manual search triggered for:', trimmedQuery);
      setIsSearching(true);
      Keyboard.dismiss();
    }
  }, [searchQuery]);

  const handleClose = useCallback(() => {
    console.log('Closing search overlay');
    setSearchQuery('');
    setIsSearching(false);
    setSelectedCategory(undefined);
    Keyboard.dismiss();
    onClose();
  }, [onClose]);

  const handleChangeText = useCallback((text: string) => {
    console.log('Search text changed:', text);
    setSearchQuery(text);
  }, []);

  const handleClearSearch = useCallback(() => {
    console.log('Clearing search');
    setSearchQuery('');
    setIsSearching(false);
    searchInputRef.current?.focus();
  }, []);

  const handleCategorySelect = useCallback((category: typeof SEARCH_CATEGORIES[number]) => {
    console.log('Category selected:', category);
    setSelectedCategory(prev => prev === category ? undefined : category);
  }, []);

  if (!isVisible) return null;

  const showResults = isSearching && debouncedSearchQuery.trim().length > 0;
  console.log('Render state:', { showResults, isSearching, query: debouncedSearchQuery.trim() });

  return (
    <View style={StyleSheet.absoluteFill}>
      <Pressable 
        className="absolute inset-0 z-50 bg-black/50"
        onPress={handleClose}
      >
        <View 
          className="w-full bg-white"
          style={{ maxHeight: SCREEN_HEIGHT * 0.9 }}
        >
          <View className="flex-row items-center p-4 space-x-4 border-b border-gray-200">
            <TouchableOpacity onPress={handleClose}>
              <Ionicons name="arrow-back" size={24} color="black" />
            </TouchableOpacity>
            <View className="flex-1 flex-row items-center bg-gray-100 rounded-full px-4 py-2">
              <Ionicons name="search" size={20} color="gray" />
              <TextInput
                ref={searchInputRef}
                className="flex-1 ml-2 text-base"
                placeholder="Search videos..."
                value={searchQuery}
                onChangeText={handleChangeText}
                onSubmitEditing={handleSearch}
                returnKeyType="search"
                clearButtonMode="while-editing"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="off"
                enablesReturnKeyAutomatically
                keyboardType="default"
              />
              {searchQuery.length > 0 && Platform.OS === 'android' && (
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
            className="py-2 border-b border-gray-200"
          >
            {SEARCH_CATEGORIES.map((category) => (
              <TouchableOpacity
                key={category}
                onPress={() => handleCategorySelect(category)}
                className={`px-4 py-1 mx-1 rounded-full ${
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
          <View style={{ flex: 1 }}>
            {showResults ? (
              <SearchResults 
                query={debouncedSearchQuery.trim()} 
                category={selectedCategory}
                onClose={handleClose}
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
        </View>
      </Pressable>
    </View>
  );
} 