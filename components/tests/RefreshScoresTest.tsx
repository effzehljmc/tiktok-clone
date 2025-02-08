import React, { useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { refreshPersonalizedScores } from '@/services/personalized-feed';
import { useAuth } from '@/hooks/useAuth';

export default function RefreshScoresTest() {
  const { user } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);

  const handleRefresh = async () => {
    if (!user) return;
    
    try {
      setIsRefreshing(true);
      setError(null);
      
      await refreshPersonalizedScores(user.id);
      
      setLastRefreshTime(new Date());
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to refresh scores'));
      console.error('Error refreshing scores:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Please login to test score refresh</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Refresh Scores Test</Text>
      
      <Pressable 
        style={[styles.button, isRefreshing && styles.buttonDisabled]}
        onPress={handleRefresh}
        disabled={isRefreshing}
      >
        {isRefreshing ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Refresh Scores</Text>
        )}
      </Pressable>

      {lastRefreshTime && (
        <Text style={styles.text}>
          Last refreshed: {lastRefreshTime.toLocaleTimeString()}
        </Text>
      )}

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Error occurred:</Text>
          <Text style={styles.errorText}>{error.message}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#000',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 200,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  text: {
    color: '#fff',
    marginTop: 12,
  },
  errorContainer: {
    marginTop: 20,
    padding: 16,
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
    borderRadius: 8,
    width: '100%',
  },
  errorTitle: {
    color: '#ff4444',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  errorText: {
    color: '#ff4444',
  },
}); 