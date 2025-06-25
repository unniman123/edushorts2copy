/**
 * Theme Constants for Edushorts App
 * Centralized design tokens for colors, typography, and responsive design
 */

// Primary Colors
export const COLORS = {
  // Brand Colors
  PRIMARY: '#ff0000',
  PRIMARY_DARK: '#cc0000',
  PRIMARY_LIGHT: '#ff3333',
  
  // Neutral Colors
  WHITE: '#ffffff',
  BLACK: '#000000',
  GRAY_900: '#333333',
  GRAY_700: '#666666',
  GRAY_500: '#888888',
  GRAY_300: '#cccccc',
  GRAY_100: '#f0f0f0',
  GRAY_50: '#e0e0e0',
  
  // Background Colors
  BACKGROUND_OVERLAY: 'rgba(0, 0, 0, 0.5)',
  BACKGROUND_CARD: 'rgba(255, 255, 255, 0.85)',
  
  // Status Colors
  SUCCESS: '#00cc00',
  WARNING: '#ff9900',
  ERROR: '#ff0000',
  INFO: '#007AFF',
} as const;

// Typography
export const TYPOGRAPHY = {
  // Font Sizes
  FONT_SIZE: {
    TINY: 11,
    SMALL: 12,
    MEDIUM: 14,
    LARGE: 16,
    XL: 18,
    XXL: 20,
  },
  
  // Font Weights
  FONT_WEIGHT: {
    NORMAL: 'normal' as const,
    MEDIUM: '600' as const,
    BOLD: 'bold' as const,
  },
  
  // Line Heights
  LINE_HEIGHT: {
    TIGHT: 22,
    NORMAL: 24,
    RELAXED: 25,
    LOOSE: 27,
  },
} as const;

// Responsive Breakpoints
export const RESPONSIVE = {
  SMALL_DEVICE_WIDTH: 375,
  
  // Character calculations for text wrapping
  CHARS_PER_LINE: {
    SMALL: {
      TITLE: 30,
      SUMMARY: 25,
    },
    LARGE: {
      TITLE: 35,
      SUMMARY: 30,
    },
  },
  
  // Base text lines for responsive design
  BASE_LINES: {
    SMALL: 14,
    LARGE: 16,
  },
} as const;

// Spacing
export const SPACING = {
  XS: 4,
  SM: 6,
  MD: 8,
  LG: 12,
  XL: 15,
  XXL: 16,
  XXXL: 18,
  XXXXL: 20,
  LARGE: 24,
  XLARGE: 30,
} as const;

// Border Radius
export const BORDER_RADIUS = {
  SMALL: 4,
  MEDIUM: 6,
  LARGE: 20,
  CIRCLE: 30,
} as const;

// Elevation/Shadow
export const ELEVATION = {
  LOW: {
    elevation: 4,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
  },
  MEDIUM: {
    elevation: 5,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  HIGH: {
    elevation: 10,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
} as const;

// Helper function to determine if device is small
export const isSmallDevice = (width: number): boolean => width < RESPONSIVE.SMALL_DEVICE_WIDTH;

// Helper function to get responsive font size
export const getResponsiveFontSize = (
  smallSize: number,
  largeSize: number,
  deviceWidth: number
): number => isSmallDevice(deviceWidth) ? smallSize : largeSize;

// Helper function to get responsive spacing
export const getResponsiveSpacing = (
  smallSpacing: number,
  largeSpacing: number,
  deviceWidth: number
): number => isSmallDevice(deviceWidth) ? smallSpacing : largeSpacing; 