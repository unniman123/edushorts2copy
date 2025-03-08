export const theme = {
  colors: {
    primary: '#007AFF',
    secondary: '#5856D6',
    background: '#F2F2F7',
    surface: '#FFFFFF',
    error: '#FF3B30',
    text: '#000000',
    textSecondary: '#8E8E93',
    textInverted: '#FFFFFF',
    border: '#C6C6C8'
  },
  spacing: {
    xsmall: 4,
    small: 8,
    medium: 16,
    large: 24,
    xlarge: 32
  },
  typography: {
    size: {
      xsmall: 12,
      small: 14,
      medium: 16,
      large: 18,
      xlarge: 24
    }
  },
  borderRadius: {
    small: 4,
    medium: 8,
    large: 12
  }
} as const;

export type Theme = typeof theme;
