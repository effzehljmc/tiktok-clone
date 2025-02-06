import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ErrorViewProps {
  error: Error | unknown;
}

export function ErrorView({ error }: ErrorViewProps) {
  console.error('ErrorView received error:', error);
  
  let errorMessage = 'An error occurred';
  let errorDetails = '';
  
  if (error instanceof Error) {
    errorMessage = error.message;
    errorDetails = error.stack || '';
  } else if (typeof error === 'object' && error !== null) {
    try {
      errorMessage = JSON.stringify(error);
    } catch {
      errorMessage = String(error);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1 }} className="bg-white">
      <View className="flex-1 items-center justify-center p-8">
        <Text className="text-xl font-semibold text-center mb-4 text-red-500">
          Oops!
        </Text>
        <Text className="text-gray-500 text-center mb-2">
          {errorMessage}
        </Text>
        {__DEV__ && errorDetails ? (
          <Text className="text-xs text-gray-400 text-center mt-4">
            {errorDetails}
          </Text>
        ) : null}
      </View>
    </SafeAreaView>
  );
} 