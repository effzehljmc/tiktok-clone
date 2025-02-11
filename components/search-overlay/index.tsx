import React, { useEffect } from 'react';
import { Animated, Keyboard, Platform } from 'react-native';

const SearchOverlay: React.FC = () => {
  const keyboardOffset = new Animated.Value(0);

  useEffect(() => {
    if (Platform.OS === 'ios') {
      const keyboardWillShow = Keyboard.addListener(
        'keyboardWillShow',
        (event) => {
          // iOS 18 spezifische Anpassung
          const iosVersion = parseInt(Platform.Version, 10);
          const keyboardHeight = event.endCoordinates.height;
          const adjustedHeight = iosVersion >= 18 ? keyboardHeight + 10 : keyboardHeight;
          
          Animated.timing(keyboardOffset, {
            toValue: -adjustedHeight,
            duration: event.duration,
            useNativeDriver: true,
          }).start();
        }
      );

      const keyboardWillHide = Keyboard.addListener(
        'keyboardWillHide',
        (event) => {
          Animated.timing(keyboardOffset, {
            toValue: 0,
            duration: event.duration,
            useNativeDriver: true,
          }).start();
        }
      );

      return () => {
        keyboardWillShow.remove();
        keyboardWillHide.remove();
      };
    }
  }, []);

  return (
    // Rest of the component code
  );
};

export default SearchOverlay; 