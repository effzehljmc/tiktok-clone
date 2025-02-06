import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: '#fff',
        tabBarInactiveTintColor: 'rgba(255,255,255,0.8)',
        tabBarLabelStyle: styles.tabLabel,
        tabBarBackground: () => (
          <BlurView
            tint="dark"
            intensity={30}
            style={StyleSheet.absoluteFill}
          />
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'For You',
          tabBarIcon: ({ color }) => (
            <Ionicons name="play-circle-outline" size={24} color={color} style={styles.tabIcon} />
          ),
        }}
      />
      <Tabs.Screen
        name="recipe"
        options={{
          title: 'Recipe',
          tabBarIcon: ({ color }) => (
            <Ionicons name="restaurant-outline" size={24} color={color} style={styles.tabIcon} />
          ),
        }}
      />
      <Tabs.Screen
        name="cookbook"
        options={{
          title: 'Cookbook',
          tabBarIcon: ({ color }) => (
            <Ionicons name="bookmark-outline" size={24} color={color} style={styles.tabIcon} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color }) => (
            <Ionicons name="search-outline" size={24} color={color} style={styles.tabIcon} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => (
            <Ionicons name="person-outline" size={24} color={color} style={styles.tabIcon} />
          ),
        }}
      />
      <Tabs.Screen
        name="shopping_list"
        options={{
          title: 'Shopping',
          tabBarIcon: ({ color }) => (
            <Ionicons name="cart-outline" size={24} color={color} style={styles.tabIcon} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    backgroundColor: 'transparent',
    borderTopWidth: 0,
    elevation: 0,
    height: 49,
  },
  tabLabel: {
    textTransform: 'none',
    fontSize: 12,
    fontWeight: '600',
  },
  tabIcon: {
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});
