import React from 'react';
import { StyleSheet, View, StatusBar, Text, Platform, Dimensions } from 'react-native';
import { RecipeFeed } from '@/components/recipe/RecipeFeed';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useState, useEffect, useRef } from 'react';
import { TouchableOpacity } from 'react-native';
import SearchOverlay from '@/components/search-overlay';
import { ForYouTab } from './components/ForYouTab';
import { GestureDetector, Gesture, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { 
  useSharedValue,
  withSpring,
  runOnJS
} from 'react-native-reanimated';

const Tab = createMaterialTopTabNavigator();
const SCREEN_WIDTH = Dimensions.get('window').width;

// Synchroner Check für iOS 18
const isIOS18OrHigher = Platform.OS === 'ios' && parseInt(Platform.Version, 10) >= 18;

export default function FeedScreen() {
  const [currentTab, setCurrentTab] = useState('ForYou');
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const insets = useSafeAreaInsets();
  const translateX = useSharedValue(0);
  const context = useSharedValue({ x: 0 });

  // Setze den initialen translateX-Wert basierend auf dem aktuellen Tab
  useEffect(() => {
    translateX.value = currentTab === 'Recipe' ? -SCREEN_WIDTH : 0;
  }, []);

  const switchTab = (tab: string) => {
    setCurrentTab(tab);
    translateX.value = withSpring(
      tab === 'Recipe' ? -SCREEN_WIDTH : 0,
      {
        damping: 20,
      }
    );
  };

  const gesture = Gesture.Pan()
    .onStart(() => {
      context.value = { x: translateX.value };
    })
    .onUpdate((event) => {
      const newValue = event.translationX + context.value.x;
      // Begrenzen Sie die Translation auf die Bildschirmbreite
      translateX.value = Math.max(-SCREEN_WIDTH, Math.min(0, newValue));
    })
    .onEnd((event) => {
      const velocity = event.velocityX;
      const currentPosition = translateX.value;
      const threshold = SCREEN_WIDTH / 3;
      
      // Determine direction and target position
      if (Math.abs(velocity) > 500) {
        // Fast swipe - use velocity to determine direction
        if (velocity > 0) {
          // Swipe right - go to ForYou
          runOnJS(setCurrentTab)('ForYou');
          translateX.value = withSpring(0, { velocity, damping: 20 });
        } else {
          // Swipe left - go to Recipe
          runOnJS(setCurrentTab)('Recipe');
          translateX.value = withSpring(-SCREEN_WIDTH, { velocity, damping: 20 });
        }
      } else {
        // Slow swipe - use position threshold
        if (currentPosition > -threshold) {
          // Closer to ForYou position
          runOnJS(setCurrentTab)('ForYou');
          translateX.value = withSpring(0, { damping: 20 });
        } else {
          // Closer to Recipe position
          runOnJS(setCurrentTab)('Recipe');
          translateX.value = withSpring(-SCREEN_WIDTH, { damping: 20 });
        }
      }
    });

  useEffect(() => {
    if (Platform.OS === 'ios') {
      StatusBar.setBarStyle('light-content', true);
    } else {
      StatusBar.setTranslucent(true);
      StatusBar.setBackgroundColor('transparent');
      StatusBar.setBarStyle('light-content');
    }
  }, []);

  // Einheitliches Safe-Area-Layout
  return (
    <View style={styles.rootContainer}>
      <View 
        style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.8)' }]}
        pointerEvents="none"
      />
      
      {isIOS18OrHigher ? (
        // iOS 18 Layout
        <GestureHandlerRootView style={styles.fallbackContainer}>
          <SafeAreaView edges={['top']} style={styles.customTabBarContainer}>
            <View style={styles.customTabBar}>
              <TouchableOpacity 
                style={[styles.customTab, currentTab === 'ForYou' && styles.activeTab]}
                onPress={() => switchTab('ForYou')}
              >
                <Text style={[styles.customTabText, currentTab === 'ForYou' && styles.activeTabText]}>
                  For You
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.customTab, currentTab === 'Recipe' && styles.activeTab]}
                onPress={() => switchTab('Recipe')}
              >
                <Text style={[styles.customTabText, currentTab === 'Recipe' && styles.activeTabText]}>
                  Recipe
                </Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
          <GestureDetector gesture={gesture}>
            <Animated.View 
              style={[
                styles.contentContainer,
                {
                  flexDirection: 'row',
                  width: SCREEN_WIDTH * 2,
                  transform: [{ translateX }]
                }
              ]}
            >
              <View style={{ width: SCREEN_WIDTH }}>
                <ForYouTab />
              </View>
              <View style={{ width: SCREEN_WIDTH }}>
                <RecipeFeed />
              </View>
            </Animated.View>
          </GestureDetector>
        </GestureHandlerRootView>
      ) : (
        // Standard TabNavigator für andere iOS Versionen
        <SafeAreaView style={styles.safeArea} edges={['right', 'left', 'top']}>
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
              component={RecipeFeed}
              options={{
                tabBarLabel: 'Recipe',
              }}
            />
          </Tab.Navigator>
        </SafeAreaView>
      )}

      <SearchOverlay 
        isVisible={isSearchVisible}
        onClose={() => setIsSearchVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: 'black',
  },
  safeArea: {
    flex: 1,
  },
  fallbackContainer: {
    flex: 1,
    overflow: 'hidden',
  },
  customTabBarContainer: {
    backgroundColor: 'transparent',
    zIndex: 1,
  },
  contentContainer: {
    flex: 1,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
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
  customTabBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    padding: 10,
    paddingTop: Platform.OS === 'ios' ? 8 : 10,
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
    color: 'rgba(255,255,255,0.6)',
  },
  activeTabText: {
    color: '#fff',
  },
});

