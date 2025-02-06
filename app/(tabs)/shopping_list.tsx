import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Share } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/useAuth';
import { useShoppingList } from '@/hooks/useShoppingList';
import { Ionicons } from '@expo/vector-icons';
import { AuthPrompt } from '@/components/auth/AuthPrompt';
import { ErrorView } from '@/components/common/ErrorView';
import { LoadingView } from '@/components/common/LoadingView';
import Toast from 'react-native-toast-message';

export default function ShoppingListScreen() {
  const { user } = useAuth();
  const { 
    items, 
    isLoading, 
    error,
    toggleItem,
    deleteItem,
    deleteCheckedItems,
    isToggling,
    isDeleting,
    isDeletingChecked
  } = useShoppingList(user?.id || '');

  if (!user) {
    return <AuthPrompt message="Sign in to view your shopping list" />;
  }

  if (isLoading) return <LoadingView />;
  if (error) return <ErrorView error={error} />;

  const handleShare = async () => {
    try {
      // Format the shopping list as text
      const listText = items
        .map(item => {
          const quantity = item.quantity ? `${item.quantity} ` : '';
          const unit = item.unit ? `${item.unit} ` : '';
          const checkbox = item.is_checked ? '☑' : '☐';
          return `${checkbox} ${quantity}${unit}${item.ingredient}`;
        })
        .join('\n');

      const message = `Shopping List:\n\n${listText}`;

      await Share.share({
        message,
        title: 'Shopping List'
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Failed to share list',
      });
    }
  };

  const handleClearChecked = async () => {
    try {
      await deleteCheckedItems();
      Toast.show({
        type: 'success',
        text1: 'Cleared checked items',
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Failed to clear items',
      });
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      await deleteItem(itemId);
      Toast.show({
        type: 'success',
        text1: 'Item removed',
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Failed to remove item',
      });
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <View className="flex-row items-center p-4 bg-white border-b border-gray-100">
      <TouchableOpacity
        onPress={() => toggleItem(item.id)}
        disabled={isToggling}
        className="mr-3"
      >
        <View className={`w-6 h-6 rounded-full border-2 ${
          item.is_checked 
            ? 'bg-blue-500 border-blue-500' 
            : 'border-gray-300'
        } justify-center items-center`}>
          {item.is_checked && (
            <Ionicons name="checkmark" size={16} color="white" />
          )}
        </View>
      </TouchableOpacity>
      
      <View className="flex-1">
        <Text className={`text-base ${
          item.is_checked ? 'text-gray-400 line-through' : 'text-gray-900'
        }`}>
          {item.quantity && `${item.quantity} `}
          {item.unit && `${item.unit} `}
          {item.ingredient}
        </Text>
      </View>

      <TouchableOpacity
        onPress={() => handleDeleteItem(item.id)}
        disabled={isDeleting}
        className="p-2"
      >
        <Ionicons 
          name="trash-outline" 
          size={20} 
          color={isDeleting ? "#999" : "#FF3B30"} 
        />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView edges={['left', 'right']} className="flex-1 bg-gray-50">
      <View className="flex-row justify-between items-center px-4 py-2 bg-white border-b border-gray-200">
        <Text className="text-2xl font-bold">Shopping List</Text>
        <View className="flex-row items-center gap-2">
          {items.length > 0 && (
            <TouchableOpacity
              onPress={handleShare}
              className="py-2 px-4 rounded-full bg-blue-500"
            >
              <Text className="text-white">Share</Text>
            </TouchableOpacity>
          )}
          {items.some(item => item.is_checked) && (
            <TouchableOpacity
              onPress={handleClearChecked}
              disabled={isDeletingChecked}
              className="py-2 px-4 rounded-full bg-gray-100"
            >
              {isDeletingChecked ? (
                <ActivityIndicator size="small" color="#666" />
              ) : (
                <Text className="text-gray-600">Clear checked</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>

      {items.length === 0 ? (
        <View className="flex-1 justify-center items-center p-4">
          <Ionicons name="cart-outline" size={48} color="#999" />
          <Text className="text-gray-500 text-lg mt-4">
            Your shopping list is empty
          </Text>
          <Text className="text-gray-400 text-center mt-2">
            Add ingredients from recipes to create your shopping list
          </Text>
        </View>
      ) : (
        <FlashList
          data={items}
          renderItem={renderItem}
          estimatedItemSize={60}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </SafeAreaView>
  );
} 