import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { useShoppingList } from '@/hooks/useShoppingList';
import { ShoppingListItem } from '@/components/shopping/ShoppingListItem';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

const COLORS = {
  background: '#000000',
  surface: '#121212',
  surfaceLight: '#1a1a1a',
  cardBackground: '#1e1e1e',
  primary: '#2563eb',
  white: '#ffffff',
  whiteAlpha90: 'rgba(255,255,255,0.9)',
  whiteAlpha60: 'rgba(255,255,255,0.6)',
  whiteAlpha30: 'rgba(255,255,255,0.3)',
  whiteAlpha10: 'rgba(255,255,255,0.1)',
  whiteAlpha05: 'rgba(255,255,255,0.05)',
  danger: '#ef4444',
} as const;

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
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerContainer}>
          <Ionicons name="cart-outline" size={48} color={COLORS.whiteAlpha30} />
          <Text style={styles.emptyTitle}>Sign in to view your shopping list</Text>
          <TouchableOpacity 
            style={styles.signInButton}
            onPress={() => router.push('/(auth)')}
          >
            <Text style={styles.signInButtonText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Group items by recipe
  const groupedItems = items.reduce((acc, item) => {
    const recipeName = item.recipe?.title || 'Other Items';
    if (!acc[recipeName]) {
      acc[recipeName] = [];
    }
    acc[recipeName].push(item);
    return acc;
  }, {} as Record<string, typeof items>);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <LinearGradient
        colors={[COLORS.surfaceLight, COLORS.background]}
        style={styles.container}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Shopping List</Text>
          <View style={styles.headerButtons}>
            <TouchableOpacity 
              style={styles.iconButton}
              onPress={() => {/* Add share functionality */}}
            >
              <Ionicons name="share-outline" size={22} color={COLORS.whiteAlpha90} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.iconButton}
              onPress={() => {/* Add new item */}}
            >
              <Ionicons name="add" size={22} color={COLORS.whiteAlpha90} />
            </TouchableOpacity>
          </View>
        </View>

        {isLoading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator color={COLORS.primary} size="large" />
          </View>
        ) : items.length === 0 ? (
          <View style={styles.centerContainer}>
            <Ionicons name="cart-outline" size={48} color={COLORS.whiteAlpha30} />
            <Text style={styles.emptyTitle}>Your shopping list is empty</Text>
            <Text style={styles.emptySubtitle}>
              Add ingredients from recipes or create your own items
            </Text>
            <TouchableOpacity 
              style={styles.exploreButton}
              onPress={() => router.push('/explore')}
            >
              <Text style={styles.exploreButtonText}>Explore Recipes</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <ScrollView 
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {Object.entries(groupedItems).map(([recipeName, recipeItems]) => (
                <View key={recipeName} style={styles.recipeSection}>
                  <Text style={styles.recipeName}>
                    {recipeName === 'Other Items' ? recipeName : `From: ${recipeName}`}
                  </Text>
                  <View style={styles.itemsContainer}>
                    {recipeItems.map((item) => (
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
                  </View>
                </View>
              ))}

              {/* Bottom Actions */}
              {items.some(item => item.is_checked) && (
                <View style={styles.buttonContainer}>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => deleteCheckedItems()}
                  >
                    <LinearGradient
                      colors={['#ef4444', '#dc2626']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.deleteButtonGradient}
                    >
                      <Ionicons name="trash-outline" size={20} color={COLORS.white} />
                      <Text style={styles.deleteButtonText}>Remove Checked Items</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              )}

              {/* Bottom spacer */}
              <View style={{ height: 50 }} />
            </ScrollView>
          </>
        )}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.white,
    letterSpacing: 0.5,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.whiteAlpha10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 16,
  },
  recipeSection: {
    marginBottom: 24,
  },
  recipeName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.whiteAlpha60,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  itemsContainer: {
    backgroundColor: COLORS.cardBackground,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.whiteAlpha10,
  },
  buttonContainer: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  deleteButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  deleteButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 8,
  },
  deleteButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.whiteAlpha90,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: COLORS.whiteAlpha60,
    textAlign: 'center',
    marginBottom: 24,
  },
  exploreButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: COLORS.primary,
    borderRadius: 24,
  },
  exploreButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  signInButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: COLORS.primary,
    borderRadius: 24,
  },
  signInButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
}); 