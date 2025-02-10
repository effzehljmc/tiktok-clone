import { FlashList } from '@shopify/flash-list';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { useSavedRecipes } from '@/hooks/useSavedRecipes';
import { RecipeCard } from '@/components/recipe/RecipeCard';
import { ErrorView } from '@/components/common/ErrorView';
import { LoadingView } from '@/components/common/LoadingView';
import { AuthPrompt } from '@/components/auth/AuthPrompt';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { router } from 'expo-router';

// Add color constants at the top of the file
const COLORS = {
  background: '#000000',
  surface: '#121212',
  surfaceLight: '#1a1a1a',
  primary: '#2563eb',
  white: '#ffffff',
  whiteAlpha90: 'rgba(255,255,255,0.9)',
  whiteAlpha60: 'rgba(255,255,255,0.6)',
  whiteAlpha30: 'rgba(255,255,255,0.3)',
  whiteAlpha10: 'rgba(255,255,255,0.1)',
  whiteAlpha05: 'rgba(255,255,255,0.05)',
} as const;

export default function CookbookScreen() {
  const { user } = useAuth();
  
  if (!user) {
    return <AuthPrompt message="Sign in to save your favorite recipes" />;
  }

  const { savedRecipes, isLoading, error } = useSavedRecipes(user.id);

  if (isLoading) return <LoadingView />;
  if (error) return <ErrorView error={error} />;

  // Filter out saved recipes with missing video data
  const validRecipes = savedRecipes.filter(recipe => recipe.video !== null);

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={[COLORS.surfaceLight, COLORS.background]}
        style={styles.container}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Cookbook</Text>
          {validRecipes.length > 0 && (
            <TouchableOpacity 
              style={styles.filterButton}
              onPress={() => {/* Add filter functionality */}}
            >
              <Ionicons name="filter" size={20} color={COLORS.whiteAlpha90} />
            </TouchableOpacity>
          )}
        </View>
        
        {!validRecipes.length ? (
          <View style={styles.emptyContainer}>
            <View style={styles.iconContainer}>
              <Ionicons name="bookmark-outline" size={48} color={COLORS.whiteAlpha30} />
            </View>
            <Text style={styles.emptyTitle}>No saved recipes yet</Text>
            <Text style={styles.emptySubtitle}>
              Save your favorite recipes to access them quickly later
            </Text>
            <TouchableOpacity 
              style={styles.exploreButton}
              onPress={() => router.push('/explore')}
            >
              <Text style={styles.exploreButtonText}>Explore Recipes</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlashList
            data={validRecipes}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={styles.cardContainer}
                onPress={() => {/* Navigate to recipe detail */}}
                activeOpacity={0.9}
              >
                <BlurView intensity={20} tint="dark" style={styles.card}>
                  <RecipeCard recipe={item.video!} />
                  <View style={styles.cardFooter}>
                    <View style={styles.statsContainer}>
                      <View style={styles.stat}>
                        <Ionicons name="eye-outline" size={16} color={COLORS.whiteAlpha60} />
                        <Text style={styles.statText}>{item.video?.viewsCount || 0}</Text>
                      </View>
                      <View style={styles.stat}>
                        <Ionicons name="heart-outline" size={16} color={COLORS.whiteAlpha60} />
                        <Text style={styles.statText}>{item.video?.likesCount || 0}</Text>
                      </View>
                    </View>
                    <TouchableOpacity style={styles.moreButton}>
                      <Ionicons name="ellipsis-horizontal" size={20} color={COLORS.whiteAlpha90} />
                    </TouchableOpacity>
                  </View>
                </BlurView>
              </TouchableOpacity>
            )}
            estimatedItemSize={300}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
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
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.whiteAlpha10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.whiteAlpha05,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.whiteAlpha90,
    marginBottom: 12,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: COLORS.whiteAlpha60,
    textAlign: 'center',
    lineHeight: 22,
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
  cardContainer: {
    marginBottom: 16,
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  card: {
    backgroundColor: COLORS.whiteAlpha05,
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.whiteAlpha10,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    color: COLORS.whiteAlpha60,
    fontSize: 14,
  },
  moreButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.whiteAlpha05,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingVertical: 16,
  },
}); 