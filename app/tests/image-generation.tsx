import React from 'react';
import { Stack } from 'expo-router';
import { ImageGenerationTest } from '../../components/tests/ImageGenerationTest';

export default function ImageGenerationTestScreen() {
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Image Generation Test',
          headerShown: true,
        }}
      />
      <ImageGenerationTest />
    </>
  );
} 