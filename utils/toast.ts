import { Alert } from 'react-native';

export type ToastType = 'success' | 'error' | 'info';

export const showToast = (type: ToastType, message: string): void => {
  let title = 'Notice';
  
  switch (type) {
    case 'success':
      title = 'Success';
      break;
    case 'error':
      title = 'Error';
      break;
    case 'info':
      title = 'Info';
      break;
  }

  Alert.alert(title, message);
};
