import { View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ErrorViewProps {
  error: Error | unknown;
  onRetry?: () => void;
  message?: string;
}

export function ErrorView({ error, onRetry, message }: ErrorViewProps) {
  console.error('ErrorView received error:', error);
  
  let errorMessage = message || 'An error occurred';
  let errorDetails = '';
  
  if (error instanceof Error) {
    errorMessage = message || error.message;
    errorDetails = error.stack || '';
  } else if (typeof error === 'object' && error !== null) {
    try {
      errorMessage = message || JSON.stringify(error);
    } catch {
      errorMessage = message || String(error);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1 }} className="bg-black">
      <View className="flex-1 items-center justify-center p-8">
        <Text className="text-xl font-semibold text-center mb-4 text-red-500">
          Oops!
        </Text>
        <Text className="text-gray-300 text-center mb-2">
          {errorMessage}
        </Text>
        {__DEV__ && errorDetails ? (
          <Text className="text-xs text-gray-500 text-center mt-4">
            {errorDetails}
          </Text>
        ) : null}
        {onRetry && (
          <Pressable
            onPress={onRetry}
            className="mt-6 bg-white/10 px-6 py-3 rounded-full"
          >
            <Text className="text-white font-medium">Try Again</Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
} 