import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { useShoppingList } from '@/hooks/useShoppingList';
import { ShoppingListItem } from '@/components/shopping/ShoppingListItem';
import { Ionicons } from '@expo/vector-icons';

export default function ShoppingListScreen() {
  const { user } = useAuth();
  const { 
    items, 
    isLoading,
    toggleItem,
    updateItem,
    deleteItem,
    deleteCheckedItems,
  } = useShoppingList(user?.id || '');

  if (!user) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Text>Please log in to view your shopping list</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="flex-row justify-between items-center p-4 bg-white border-b border-gray-200">
        <Text className="text-2xl font-bold">Shopping List</Text>
        <TouchableOpacity 
          onPress={() => {}} 
          className="bg-blue-500 rounded-full p-2"
        >
          <Ionicons name="share-outline" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <Text>Loading shopping list...</Text>
        </View>
      ) : items.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-gray-500">Your shopping list is empty</Text>
        </View>
      ) : (
        <>
          <ScrollView className="flex-1">
            {items.map((item) => (
              <ShoppingListItem
                key={item.id}
                item={item}
                onToggle={() => toggleItem(item.id)}
                onUpdate={(updatedItem) => 
                  updateItem({ 
                    itemId: updatedItem.id, 
                    updates: { 
                      quantity: updatedItem.quantity,
                      unit: updatedItem.unit 
                    } 
                  })
                }
                onDelete={deleteItem}
              />
            ))}
          </ScrollView>

          {/* Bottom Actions */}
          {items.some(item => item.is_checked) && (
            <View className="p-4 bg-white border-t border-gray-200">
              <TouchableOpacity
                onPress={() => deleteCheckedItems()}
                className="flex-row items-center justify-center bg-red-500 p-3 rounded-lg"
              >
                <Ionicons name="trash-outline" size={20} color="white" />
                <Text className="ml-2 text-white font-medium">Remove Checked Items</Text>
              </TouchableOpacity>
            </View>
          )}
        </>
      )}
    </View>
  );
} 