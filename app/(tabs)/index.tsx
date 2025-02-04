import { View } from 'react-native';
import { VideoFeed } from '@/components/video/VideoFeed';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function FeedScreen() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <VideoFeed />
    </SafeAreaView>
  );
}

