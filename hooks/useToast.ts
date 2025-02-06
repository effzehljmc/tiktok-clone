import Toast from 'react-native-toast-message';

interface ToastOptions {
  message: string;
  type?: 'success' | 'error' | 'info';
}

export function useToast() {
  const show = ({ message, type = 'success' }: ToastOptions) => {
    Toast.show({
      type,
      text1: message,
      position: 'bottom',
      visibilityTime: 2000,
    });
  };

  return { show };
} 