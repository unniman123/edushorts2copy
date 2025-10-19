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
  BACKGROUND_LIGHT: '#f8f9fa',
  BACKGROUND_INPUT: '#f5f5f5',
  
  // Status Colors
  SUCCESS: '#00cc00',
  WARNING: '#ff9900',
  ERROR: '#ff0000',
  INFO: '#007AFF',
  
  // Text Colors
  TEXT_PRIMARY: '#333333',
  TEXT_SECONDARY: '#666666',
  TEXT_TERTIARY: '#888888',
  TEXT_PLACEHOLDER: '#888888',
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
    XXXL: 28,
    TITLE: 32,
  },
  
  // Font Weights
  FONT_WEIGHT: {
    NORMAL: 'normal' as const,
    MEDIUM: '600' as const,
    BOLD: 'bold' as const,
    EXTRA_BOLD: '800' as const,
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
  XXLARGE: 40,
} as const;

// Border Radius - Centralized values found in assessment
export const BORDER_RADIUS = {
  NONE: 0,
  SMALL: 4,
  MEDIUM: 8,
  LARGE: 12,  // Most common value found (12+ instances)
  XL: 20,
  CIRCLE: 30,
  PILL: 40,
} as const;

// Elevation/Shadow - Centralized shadow patterns
export const ELEVATION = {
  NONE: {
    elevation: 0,
    shadowOpacity: 0,
  },
  LOW: {
    elevation: 2,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  MEDIUM: {
    elevation: 4,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
  },
  HIGH: {
    elevation: 5,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  CARD: {
    // Standard card shadow pattern found in 8+ files
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
} as const;

// Common Component Styles - Extracted duplicated patterns
export const COMPONENT_STYLES = {
  // Card container pattern found in multiple components
  CARD_CONTAINER: {
    flexDirection: 'row' as const,
    backgroundColor: COLORS.WHITE,
    borderRadius: BORDER_RADIUS.LARGE,
    overflow: 'hidden' as const,
    marginBottom: 16,
    ...ELEVATION.CARD,
  },
  
  // Button patterns
  BUTTON_PRIMARY: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: BORDER_RADIUS.LARGE,
    paddingVertical: 15,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  
  // Input container pattern
  INPUT_CONTAINER: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: COLORS.BACKGROUND_INPUT,
    borderRadius: BORDER_RADIUS.LARGE,
    paddingHorizontal: 16,
    height: 56,
  },
  
  // Header pattern
  HEADER_CONTAINER: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    padding: 16,
    backgroundColor: COLORS.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
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

// Static NewsCard styles - Performance optimized
export const NEWSCARD_STATIC_STYLES = {
  fullScreenCard: {
    flex: 1,
    backgroundColor: COLORS.WHITE,
    overflow: 'hidden' as const,
    borderRadius: 0,
    margin: 0,
    padding: 0,
  },
} as const;

// Static NewsCardContent styles - Performance optimized
export const NEWSCARD_CONTENT_STATIC_STYLES = {
  cardContentContainer: {
    flex: 1,
    backgroundColor: COLORS.WHITE,
    borderTopLeftRadius: BORDER_RADIUS.LARGE,
    borderTopRightRadius: BORDER_RADIUS.LARGE,
    position: 'relative' as const,
    marginTop: -BORDER_RADIUS.LARGE,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  contentWrapperBase: {
    flex: 1,
    paddingTop: SPACING.MD,
    paddingBottom: SPACING.XS,
    minHeight: 200,
  },
  categoryContainer: {
    paddingBottom: 2,
    alignItems: 'flex-start' as const,
  },
  categoryButton: {
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: 2,
    paddingVertical: 1,
    borderRadius: BORDER_RADIUS.SMALL,
    maxWidth: '40%',
    alignSelf: 'flex-start' as const,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 3,
  },
  belowSummaryActions: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'flex-start' as const,
    marginTop: 4,
    paddingHorizontal: 0,
  },
  readMoreButton: {
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
    paddingVertical: 0,
    marginRight: SPACING.SM,
  },
  categoryText: {
    color: COLORS.WHITE,
    fontSize: TYPOGRAPHY.FONT_SIZE.TINY,
    fontWeight: TYPOGRAPHY.FONT_WEIGHT.BOLD,
    textAlign: 'center' as const,
    letterSpacing: 0.5,
  },
  readMoreText: {
    fontSize: TYPOGRAPHY.FONT_SIZE.TINY,
    color: COLORS.PRIMARY,
    fontWeight: TYPOGRAPHY.FONT_WEIGHT.BOLD,
    letterSpacing: 0.1,
    textDecorationLine: 'underline' as const,
  },
  timestamp: {
    fontSize: TYPOGRAPHY.FONT_SIZE.TINY,
    color: COLORS.GRAY_500,
    textAlign: 'left' as const,
    fontWeight: TYPOGRAPHY.FONT_WEIGHT.NORMAL,
    letterSpacing: 0.1,
  },
  titleContainer: {
    paddingBottom: SPACING.XS,
  },
  summaryContainer: {
    flex: 1,
    position: 'relative' as const,
  },
  summaryScrollView: {
    flex: 1,
    minHeight: 120,
  },
  summaryScrollContent: {
    paddingBottom: SPACING.XLARGE,
    minHeight: 100,
  },
} as const; 