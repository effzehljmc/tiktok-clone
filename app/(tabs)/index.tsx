import { StyleSheet, View, StatusBar } from 'react-native';
import { RecipeFeed } from '@/components/recipe/RecipeFeed';
import { VideoFeed } from '@/components/video/VideoFeed';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useState, useEffect } from 'react';
import { TouchableOpacity } from 'react-native';
import SearchOverlay from '@/components/search-overlay';

const Tab = createMaterialTopTabNavigator();

function ForYouTab() {
  return <VideoFeed showSearchIcon={false} />;
}

function RecipeTab() {
  return <RecipeFeed />;
}

export default function FeedScreen() {
  const [currentTab, setCurrentTab] = useState('ForYou');
  const [isSearchVisible, setIsSearchVisible] = useState(false);

  useEffect(() => {
    StatusBar.setTranslucent(true);
    StatusBar.setBackgroundColor('transparent');
    StatusBar.setBarStyle('light-content');
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: 'black' }}>
      <SafeAreaView style={styles.tabContainer} edges={['bottom', 'left', 'right']}>
        <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
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
});

