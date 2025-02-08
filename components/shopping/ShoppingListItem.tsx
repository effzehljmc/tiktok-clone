import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { useShoppingList } from '@/hooks/useShoppingList';
import { Ionicons } from '@expo/vector-icons';

type ShoppingListItemType = ReturnType<typeof useShoppingList>['items'][number];

interface ShoppingListItemProps {
  item: ShoppingListItemType;
  onUpdate?: (item: ShoppingListItemType) => void;
  onDelete?: (id: string) => void;
  onToggle?: () => void;
}

export function ShoppingListItem({ item, onUpdate, onDelete, onToggle }: ShoppingListItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [quantity, setQuantity] = useState(item.quantity);

  return (
    <View className="flex-row items-center p-4 bg-white">
      {/* Checkbox */}
      <TouchableOpacity 
        onPress={onToggle}
        className="mr-3"
      >
        <View className={`w-6 h-6 rounded-full border-2 ${item.is_checked ? 'bg-blue-500 border-blue-500' : 'border-gray-300'}`}>
          {item.is_checked && (
            <Ionicons name="checkmark" size={16} color="white" />
          )}
        </View>
      </TouchableOpacity>

      {/* Main Content */}
      <View className="flex-1">
        {/* Recipe Source - Only show if from a recipe */}
        {item.recipe && (
          <View className="flex-row items-center mb-1">
            <Text className="text-xs text-gray-500">
              From: {item.recipe.title}
              {item.variation && (
                <Text className="italic text-blue-500">
                  {' '}({item.variation.variationType.toLowerCase().replace('_', ' ')})
                </Text>
              )}
            </Text>
          </View>
        )}

        {/* Item Name Row */}
        <View className="flex-row items-center">
          {/* Quantity and Name */}
          <View className="flex-row items-center flex-1">
            <Text className={`text-base ${item.is_substitution ? 'text-blue-600' : 'text-gray-900'}`}>
              {quantity} {item.ingredient}
            </Text>
            {item.is_substitution && (
              <View className="ml-2 px-2 py-0.5 bg-blue-100 rounded">
                <Text className="text-xs text-blue-600">Substitution</Text>
              </View>
            )}
          </View>

          {/* Actions */}
          <View className="flex-row items-center">
            <TouchableOpacity
              onPress={() => setIsEditing(!isEditing)}
              className="p-2"
            >
              <Ionicons name="pencil-outline" size={20} color="#3B82F6" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => onDelete?.(item.id)}
              className="p-2"
            >
              <Ionicons name="trash-outline" size={20} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Notes (if any) */}
        {item.notes && (
          <Text className="text-sm text-gray-600 mt-1 italic">
            {item.notes}
          </Text>
        )}

        {/* Quantity Editor */}
        {isEditing && (
          <View className="flex-row items-center mt-2">
            <TextInput
              value={quantity}
              onChangeText={setQuantity}
              className="flex-1 p-2 border border-gray-300 rounded mr-2"
              placeholder="Enter quantity..."
              keyboardType="numeric"
            />
            <TouchableOpacity
              onPress={() => {
                setIsEditing(false);
                onUpdate?.({ ...item, quantity });
              }}
              className="bg-blue-500 px-3 py-1 rounded"
            >
              <Text className="text-white">Save</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
} 
