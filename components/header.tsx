import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SearchOverlay from './search-overlay';

export default function Header({ color }: { color: string }) {
  const router = useRouter();
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const insets = useSafeAreaInsets();

  const handleSearch = (query: string) => {
    // TODO: Implement search functionality
    console.log('Searching for:', query);
    setIsSearchVisible(false);
  };

  return (
    <View 
      className="absolute left-0 right-0 z-50"
      style={{ 
        paddingTop: insets.top,
      }}
    >
      <View className="flex-row items-center justify-between px-4 py-2">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color="white" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setIsSearchVisible(true)}>
          <Ionicons name="search" size={28} color="white" />
        </TouchableOpacity>
      </View>
      <SearchOverlay 
        isVisible={isSearchVisible}
        onClose={() => setIsSearchVisible(false)}
        onSearch={handleSearch}
      />
    </View>
  );
}; 
