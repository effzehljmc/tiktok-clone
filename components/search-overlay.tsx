import React from 'react';
import { View, TextInput, TouchableOpacity, Keyboard, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';

interface SearchOverlayProps {
  isVisible: boolean;
  onClose: () => void;
  onSearch: (query: string) => void;
}

export default function SearchOverlay({ isVisible, onClose, onSearch }: SearchOverlayProps) {
  const [searchQuery, setSearchQuery] = useState('');

  if (!isVisible) return null;

  const handleSearch = () => {
    onSearch(searchQuery);
    Keyboard.dismiss();
  };

  return (
    <Pressable 
      className="absolute inset-0 z-50 bg-black/50"
      onPress={onClose}
    >
      <Pressable className="w-full">
        <View className="bg-white">
          <View className="flex-row items-center p-4 space-x-4">
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="arrow-back" size={24} color="black" />
            </TouchableOpacity>
            <View className="flex-1 flex-row items-center bg-gray-100 rounded-full px-4 py-2">
              <Ionicons name="search" size={20} color="gray" />
              <TextInput
                className="flex-1 ml-2 text-base"
                placeholder="Search videos..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={handleSearch}
                autoFocus
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={20} color="gray" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Pressable>
    </Pressable>
  );
} 