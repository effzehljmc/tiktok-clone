import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SearchOverlay from './search-overlay';

interface HeaderProps {
  color?: string;
  showBackButton?: boolean;
  showSearchIcon?: boolean;
}

export default function Header({ color = 'black', showBackButton = true, showSearchIcon = true }: HeaderProps) {
  const router = useRouter();
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const insets = useSafeAreaInsets();

  return (
    <View 
      className="absolute left-0 right-0 z-50"
      style={{ 
        paddingTop: insets.top,
      }}
    >
      <View className="flex-row items-center justify-between px-4 py-2">
        {showBackButton && (
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={color} />
          </TouchableOpacity>
        )}
        {showSearchIcon && (
          <TouchableOpacity 
            onPress={() => setIsSearchVisible(true)} 
            style={{ 
              marginLeft: 'auto',
              backgroundColor: 'rgba(0,0,0,0.5)',
              padding: 8,
              borderRadius: 20,
            }}
          >
            <Ionicons name="search" size={24} color={color} />
          </TouchableOpacity>
        )}
      </View>
      <SearchOverlay 
        isVisible={isSearchVisible}
        onClose={() => setIsSearchVisible(false)}
      />
    </View>
  );
} 
