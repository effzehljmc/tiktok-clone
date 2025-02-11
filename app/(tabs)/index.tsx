import { StyleSheet, View, StatusBar, ActivityIndicator, Text } from 'react-native';
import { RecipeFeed } from '@/components/recipe/RecipeFeed';
import { VideoFeed } from '@/components/video/VideoFeed';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useState, useEffect } from 'react';
import { TouchableOpacity } from 'react-native';
import SearchOverlay from '@/components/search-overlay';
import { useVideos } from '@/hooks/useVideos';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const Tab = createMaterialTopTabNavigator();

function ForYouTab() {
  const { data: videos, isLoading, error } = useVideos();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (error) {
    console.error('Error loading videos:', error);
    return (
      <View style={styles.loadingContainer}>
        <Text style={{ color: 'white' }}>Could not load videos. Please try again.</Text>
      </View>
    );
  }

  if (!videos || videos.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={{ color: 'white' }}>No videos available</Text>
      </View>
    );
  }

  return <VideoFeed videos={videos} showSearchIcon={false} />;
}

function RecipeTab() {
  return <RecipeFeed />;
}

export default function FeedScreen() {
  const [currentTab, setCurrentTab] = useState('ForYou');
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (Platform.OS === 'ios') {
      StatusBar.setBarStyle('light-content');
    } else {
      StatusBar.setTranslucent(true);
      StatusBar.setBackgroundColor('transparent');
      StatusBar.setBarStyle('light-content');
    }
  }, []);

  const [shouldUseFallbackNavigation, setShouldUseFallbackNavigation] = useState(false);

  useEffect(() => {
    const checkIOSVersion = async () => {
      if (Platform.OS === 'ios') {
        const version = parseInt(Platform.Version, 10);
        setShouldUseFallbackNavigation(version >= 18);
      }
    };
    checkIOSVersion();
  }, []);

  if (shouldUseFallbackNavigation) {
    return (
      <View style={{ flex: 1, backgroundColor: 'black' }}>
        <SafeAreaView style={styles.tabContainer} edges={['left', 'right']}>
          {Platform.OS === 'ios' && parseInt(Platform.Version, 10) >= 18 ? (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.8)' }]} />
          ) : (
            <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
          )}
          <View style={styles.customTabBar}>
            <TouchableOpacity 
              style={[styles.customTab, currentTab === 'ForYou' && styles.activeTab]}
              onPress={() => setCurrentTab('ForYou')}
            >
              <Text style={[styles.customTabText, currentTab === 'ForYou' && styles.activeTabText]}>
                For You
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.customTab, currentTab === 'Recipe' && styles.activeTab]}
              onPress={() => setCurrentTab('Recipe')}
            >
              <Text style={[styles.customTabText, currentTab === 'Recipe' && styles.activeTabText]}>
                Recipe
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.contentContainer}>
            {currentTab === 'ForYou' ? <ForYouTab /> : <RecipeTab />}
          </View>
          <SearchOverlay 
            isVisible={isSearchVisible}
            onClose={() => setIsSearchVisible(false)}
          />
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: 'black' }}>
      <SafeAreaView style={styles.tabContainer} edges={['left', 'right']}>
        {Platform.OS === 'ios' && parseInt(Platform.Version, 10) >= 18 ? (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.8)' }]} />
        ) : (
          <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
        )}
        {currentTab === 'ForYou' && (
          <TouchableOpacity 
            style={styles.searchButton}
            onPress={() => setIsSearchVisible(true)}
          >
            <Ionicons name="search" size={24} color="white" />
          </TouchableOpacity>
        )}
        <Tab.Navigator
          style={styles.navigator}
          initialRouteName="ForYou"
          screenOptions={{
            tabBarStyle: styles.tabBar,
            tabBarIndicatorStyle: styles.indicator,
            tabBarActiveTintColor: '#fff',
            tabBarInactiveTintColor: 'rgba(255,255,255,0.6)',
            tabBarLabelStyle: styles.tabLabel,
            swipeEnabled: true,
            animationEnabled: true,
            lazy: true,
          }}
          screenListeners={{
            state: (e) => {
              const routes = e.data.state.routes;
              const index = e.data.state.index;
              setCurrentTab(routes[index].name);
            },
          }}
        >
          <Tab.Screen
            name="ForYou"
            component={ForYouTab}
            options={{
              tabBarLabel: 'For You',
            }}
          />
          <Tab.Screen
            name="Recipe"
            component={RecipeTab}
            options={{
              tabBarLabel: 'Recipe',
            }}
          />
        </Tab.Navigator>
        <SearchOverlay 
          isVisible={isSearchVisible}
          onClose={() => setIsSearchVisible(false)}
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  tabContainer: {
    flex: 1,
    position: 'relative',
  },
  contentContainer: {
    flex: 1,
    position: 'relative',
  },
  navigator: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  tabBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
    elevation: 0,
    shadowOpacity: 0,
    borderBottomWidth: 0,
    height: 44,
    zIndex: 1,
  },
  indicator: {
    backgroundColor: '#fff',
    height: 2,
  },
  tabLabel: {
    textTransform: 'none',
    fontSize: 16,
    fontWeight: '600',
  },
  searchButton: {
    position: 'absolute',
    top: 44,
    right: 16,
    zIndex: 2,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 8,
    borderRadius: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  customTabBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    padding: 10,
  },
  customTab: {
    padding: 10,
    borderRadius: 10,
  },
  activeTab: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  customTabText: {
    fontSize: 16,
    fontWeight: '600',
  },
  activeTabText: {
    color: '#fff',
  },
});

