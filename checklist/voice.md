
# Voice Commands Implementation Plan

Below is an updated plan reflecting your decision to use an online-only approach and to add a voice button initially only to the Chat and Shopping List features.

---

## 1. Overview

We will leverage an online-only speech-to-text (STT) service or library (e.g., @react-native-voice/voice) for processing all voice commands. Because the app will rely on internet connectivity, you do not need to store voice data locally or manage offline transcription models.

Key points:  
• Online-only approach to STT.  
• Minimal footprint in the app: we will first enable voice commands in the AI “Chat” screens and in the Shopping List.  
• Provide push-to-talk style interaction, with a dedicated “microphone” button in each relevant UI.

---

## 2. Proposed Scope & Commands

1. Chat Screen Commands  
   • “Create a vegetarian version of this recipe.”  
   • “How can I make this recipe gluten-free?”  
   • “Can I substitute cheese with something dairy-free?”  
   • By default, recognized text is passed as the user’s prompt to the AI agent.

2. Shopping List Commands  
   • “Add milk to my shopping list.”  
   • “Remove eggs from my shopping list.”  
   • “Show me everything that’s on the list.”  
   • Recognized text is parsed to determine if the user wants to add or remove an item.

3. Future Expansion (Out of Current Scope)  
   • Universal commands like “Go to home,” “Open my saved recipes,” or “Back.”  
   • Real-time voice notes or commentary.

---

## 3. UI & UX Flow

1. Push-to-Talk Button in AI Chat Screen  
   • Place a small microphone icon next to the text input box.  
   • When pressed, it activates the microphone and displays a “Listening…” indicator.  
   • The recognized text is placed into the text input box automatically.  
   • The user can edit or submit the text to the AI agent after transcription.

2. Push-to-Talk Button in Shopping List Screen  
   • Similarly, add a microphone icon within the Shopping List UI.  
   • When active, parse the recognized text for key actions (e.g., “Add,” “Remove”).  
   • Provide feedback if the command was understood (e.g., “Added: milk”).

3. Microphone Permissions  
   • Use expo-permissions or react-native-permissions to request microphone access.  
   • Prompt only appears the first time or if the user denies.  
   • If permission is denied, display a helpful message explaining how to enable in settings.

---

## 4. Technical Implementation

1. Install & Setup  
   • Use @react-native-voice/voice.  
   • Implement a custom hook, such as useVoiceCommands, to handle start/stop listening:  
     – startListening() → triggers microphone & sets up voice callbacks.  
     – stopListening() → stops microphone & finalizes transcripts.  
     – recognizedText → new transcript result.  

2. Integration in Chat  
   • On recognition success, set prompt = recognizedText.  
   • The user can confirm or edit the text before sending it to the AI.

3. Integration in Shopping List  
   • On recognition success, parse phrases like “add [item]” or “remove [item]” to call existing addItemFromVoice / removeItemFromVoice.  
   • Show toast or similar feedback to confirm the action.

4. Error Handling & Fallback  
   • If no text is recognized, show a short “Could not understand” message.  
   • Provide a “Try again” or “Tap to retry” button.  

---

## 5. Example Hook (Pseudocode)

Here’s a simplified version of the useVoiceCommands hook you might create:

```typescript
import { useState, useEffect } from 'react';
// import Voice from '@react-native-voice/voice';

export function useVoiceCommands() {
  const [isListening, setIsListening] = useState(false);
  const [recognizedText, setRecognizedText] = useState('');

  useEffect(() => {
    // Voice.onSpeechStart = () => setIsListening(true);
    // Voice.onSpeechEnd = () => setIsListening(false);
    // Voice.onSpeechResults = (event) => {
    //   if (event.value) {
    //     setRecognizedText(event.value[0]);
    //   }
    // };
    
    // Cleanup event listeners
    return () => {
      // Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  async function startListening() {
    setIsListening(true);
    setRecognizedText('');
    // await Voice.start('en-US');
  }

  async function stopListening() {
    setIsListening(false);
    // await Voice.stop();
  }

  return {
    isListening,
    recognizedText,
    startListening,
    stopListening,
  };
}
```

---

## 6. Roadmap & Future Considerations

• More Advanced NLP: If you want to handle more natural phrasing (e.g., “I’m out of spinach—add it to my list”), integrate a lightweight NLP layer or rely on your existing AI agent.  
• Multi-Language Support: Add or extend the language setting to handle different locales or accent difficulties.  
• Voice Feedback: Optionally add text-to-speech responses to confirm recognized commands.  
• Comprehensive Testing: Plan for real-device testing on both iOS and Android. Verify microphone permissions, partial transcripts, background noise scenarios, etc.

---

## 7. Next Steps

1. Install and configure @react-native-voice/voice (or equivalent).  
2. Create the useVoiceCommands hook as shown above.  
3. Add a microphone button to:  
   • The Chat screen (AI recipe agent)  
   • The Shopping List screen  
4. Test with real devices to handle background noise and permission prompts.  
5. Collect user feedback and refine the feature over time.

---

This plan lets you quickly integrate voice commands into two key areas of your app (Chat and Shopping List) without complicating other parts of the UI. It ensures an online-only approach, which simplifies local storage considerations and leverages external STT services for accurate transcription.
```
