import { toast as sonnerToast } from 'sonner-native';

export const toast = {
  success: (message: string) => {
    sonnerToast.success(message, {
      duration: 4000,
      style: { backgroundColor: '#4CAF50' }
    });
  },
  error: (message: string) => {
    sonnerToast.error(message, {
      duration: 4000,
      style: { backgroundColor: '#f44336' }
    });
  },
  info: (message: string) => {
    sonnerToast.info(message, {
      duration: 4000,
      style: { backgroundColor: '#2196F3' }
    });
  },
  warning: (message: string) => {
    sonnerToast.warning(message, {
      duration: 4000,
      style: { backgroundColor: '#ff9800' }
    });
  }
};
