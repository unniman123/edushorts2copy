import { Alert } from 'react-native';
import { showToast, ToastType } from '../../utils/toast'; // Adjust path as necessary

// Mock the Alert module
jest.mock('react-native', () => ({
  ...jest.requireActual('react-native'), // Import and retain default behavior
  Alert: {
    alert: jest.fn(),
  },
}));

describe('showToast', () => {
  // Clear all mocks before each test
  beforeEach(() => {
    (Alert.alert as jest.Mock).mockClear();
  });

  it('should show a success toast with the correct title and message', () => {
    const message = 'Operation completed successfully!';
    showToast('success', message);
    expect(Alert.alert).toHaveBeenCalledTimes(1);
    expect(Alert.alert).toHaveBeenCalledWith('Success', message);
  });

  it('should show an error toast with the correct title and message', () => {
    const message = 'An error occurred!';
    showToast('error', message);
    expect(Alert.alert).toHaveBeenCalledTimes(1);
    expect(Alert.alert).toHaveBeenCalledWith('Error', message);
  });

  it('should show an info toast with the correct title and message', () => {
    const message = 'Some information for you.';
    showToast('info', message);
    expect(Alert.alert).toHaveBeenCalledTimes(1);
    expect(Alert.alert).toHaveBeenCalledWith('Info', message);
  });

  it('should use "Notice" as title for an unknown type (though ToastType prevents this)', () => {
    // This case tests the default behavior of the switch, even though TypeScript
    // should prevent passing an invalid ToastType.
    // We cast to `any` to bypass TypeScript for this specific test.
    const message = 'A generic notice.';
    showToast('unknown' as any, message); // Using 'any' to test default switch case
    expect(Alert.alert).toHaveBeenCalledTimes(1);
    expect(Alert.alert).toHaveBeenCalledWith('Notice', message);
  });
}); 