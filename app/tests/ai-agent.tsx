import React from 'react';
import { Stack } from 'expo-router';
import { AIAgentTest } from '../../components/tests/AIAgentTest';

export default function AIAgentTestScreen() {
  return (
    <>
      <Stack.Screen
        options={{
          title: 'AI Agent Test',
        }}
      />
      <AIAgentTest />
    </>
  );
} 
