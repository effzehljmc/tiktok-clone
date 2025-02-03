import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        tabBarActiveTintColor: '#000',
        tabBarInactiveTintColor: '#888',
        headerShown: false,
        tabBarStyle: {
          height: 60,
          paddingBottom: 10,
          paddingTop: 10,
        },
        tabBarLabelStyle: {
          fontSize: 12,
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName = '';

          if (route.name === 'index') {
            iconName = focused ? 'home-sharp' : 'home-outline';
          } else if (route.name === 'friends') {
            iconName = focused ? 'people-sharp' : 'people-outline';
          } else if (route.name === 'camera') {
            iconName = 'camera';
            size = size + 10; // Make camera icon larger
          } else if (route.name === 'inbox') {
            iconName = focused ? 'mail-sharp' : 'mail-outline';
          } else if (route.name === 'profile') {
            iconName = focused ? 'person-sharp' : 'person-outline';
          }

          return <Ionicons name={iconName as any} size={size} color={color} />;
        },
      })}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="friends" options={{ title: 'Friends' }} />
      <Tabs.Screen 
        name="camera" 
        options={{ 
          title: '',
          tabBarIconStyle: {
            marginTop: 5,
          },
        }} 
      />
      <Tabs.Screen name="inbox" options={{ title: 'Inbox' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}
