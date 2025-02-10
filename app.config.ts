import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'tiktok-clone',
  slug: 'tiktok-clone',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  splash: {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff'
  },
  assetBundlePatterns: [
    '**/*'
  ],
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.anonymous.tiktokclone'
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#ffffff'
    },
    package: 'com.anonymous.tiktokclone'
  },
  web: {
    favicon: './assets/favicon.png'
  },
  extra: {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    BLACK_FOREST_LABS_API_KEY: process.env.EXPO_PUBLIC_BLACK_FOREST_LABS_API_KEY,
  },
  plugins: [
    'expo-router'
  ]
}); 