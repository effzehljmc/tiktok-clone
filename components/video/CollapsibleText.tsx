import React, { useState } from 'react';
import { Text, TouchableOpacity, StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

interface CollapsibleTextProps {
  text: string;
  maxChars?: number;
  style?: any;
}

export function CollapsibleText({ text, maxChars = 70, style }: CollapsibleTextProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  if (!text) return null;

  const shouldTruncate = text.length > maxChars;
  const displayedText = shouldTruncate && !isExpanded
    ? text.slice(0, maxChars).trimEnd() + '...'
    : text;

  return (
    <View style={styles.container}>
      <Animated.View entering={FadeIn.duration(200)}>
        <Text style={[styles.text, style]}>
          {displayedText}
        </Text>
      </Animated.View>
      {shouldTruncate && (
        <TouchableOpacity
          style={styles.button}
          onPress={() => setIsExpanded((prev) => !prev)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessible
          accessibilityRole="button"
          accessibilityLabel="Toggle full description"
        >
          <Text style={styles.buttonText}>
            {isExpanded ? 'Show less' : 'Show more'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  text: {
    color: 'white',
    fontSize: 14,
    lineHeight: 20,
  },
  button: {
    marginTop: 4,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  buttonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
}); 