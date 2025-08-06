/**
 * Layout Utilities for NewsCard White Space Optimization
 * 
 * Provides dynamic height calculation utilities for optimizing white space
 * around category buttons in NewsCard components. Follows performance-optimized
 * patterns established in the codebase with memoization and error handling.
 * 
 * @module layoutUtils
 */

import { TYPOGRAPHY, SPACING } from '../constants/theme';

/**
 * Interface for category button dimension calculations
 */
interface CategoryButtonDimensions {
  /** Height of the text content */
  textHeight: number;
  /** Total button height including padding */
  buttonHeight: number;
  /** Estimated button width */
  buttonWidth: number;
  /** Total height including all spacing */
  totalHeight: number;
}

/**
 * Interface for optimal spacing configuration
 */
interface OptimalSpacing {
  /** Top padding above category button */
  topPadding: number;
  /** Bottom padding below category button */
  bottomPadding: number;
  /** Left padding for category button */
  leftPadding: number;
  /** Right padding for category button */
  rightPadding: number;
}

/**
 * Responsive spacing configuration for different device sizes
 */
const OPTIMIZED_SPACING = {
  smallDevice: {
    topPadding: 1, // Minimal 1px top padding as requested
    bottomPadding: 2, // 2px bottom padding for visual separation
    leftPadding: SPACING.XXL, // Maintain existing left positioning (16px)
    minWhiteExtensionHeight: 20, // Minimum height for very short text
  },
  largeDevice: {
    topPadding: 2, // Slightly more padding for larger screens
    bottomPadding: 2, // Consistent bottom padding
    leftPadding: SPACING.XXXL, // Maintain existing left positioning (18px)
    minWhiteExtensionHeight: 22, // Minimum height for larger devices
  },
} as const;

/**
 * Calculates the height of category button text based on font properties
 * Uses standard text height estimation for React Native Text components
 * 
 * @param text - The category text content
 * @param fontSize - Font size in pixels
 * @param fontWeight - Font weight (normal, medium, bold)
 * @returns Estimated text height in pixels
 */
export const calculateCategoryTextHeight = (
  text: string,
  fontSize: number,
  fontWeight: string
): number => {
  try {
    // Input validation
    if (!text || typeof text !== 'string') {
      return fontSize; // Fallback to font size
    }

    if (fontSize <= 0 || !Number.isFinite(fontSize)) {
      return TYPOGRAPHY.FONT_SIZE.SMALL; // Fallback to default
    }

    // Base height calculation using font size
    let baseHeight = fontSize;

    // Adjust for font weight (bold text is slightly taller)
    if (fontWeight === TYPOGRAPHY.FONT_WEIGHT.BOLD || fontWeight === TYPOGRAPHY.FONT_WEIGHT.EXTRA_BOLD) {
      baseHeight *= 1.1; // 10% increase for bold text
    } else if (fontWeight === TYPOGRAPHY.FONT_WEIGHT.MEDIUM) {
      baseHeight *= 1.05; // 5% increase for medium weight
    }

    // Account for line height (React Native default is approximately 1.2x font size)
    const lineHeight = baseHeight * 1.2;

    // For single line text (category buttons are numberOfLines={1})
    return Math.ceil(lineHeight);

  } catch (error) {
    // Fallback to safe default
    return TYPOGRAPHY.FONT_SIZE.SMALL;
  }
};

/**
 * Calculates optimal white extension area height based on category button dimensions
 * Implements the 1-2px minimal padding requirement from specifications
 * 
 * @param categoryButtonHeight - Height of the category button
 * @param isSmallDevice - Whether the device is considered small
 * @returns Optimal white extension area height in pixels
 */
export const calculateOptimalWhiteExtensionHeight = (
  categoryButtonHeight: number,
  isSmallDevice: boolean
): number => {
  try {
    // Input validation
    if (categoryButtonHeight <= 0 || !Number.isFinite(categoryButtonHeight)) {
      return isSmallDevice ?
        OPTIMIZED_SPACING.smallDevice.minWhiteExtensionHeight :
        OPTIMIZED_SPACING.largeDevice.minWhiteExtensionHeight;
    }

    // Get device-specific spacing
    const spacing = isSmallDevice ? OPTIMIZED_SPACING.smallDevice : OPTIMIZED_SPACING.largeDevice;

    // Calculate total height: button + top padding + bottom padding
    const calculatedHeight = categoryButtonHeight + spacing.topPadding + spacing.bottomPadding;

    // Ensure minimum height constraint
    const finalHeight = Math.max(calculatedHeight, spacing.minWhiteExtensionHeight);

    return Math.ceil(finalHeight);

  } catch (error) {
    // Fallback to minimum safe height
    return isSmallDevice ?
      OPTIMIZED_SPACING.smallDevice.minWhiteExtensionHeight :
      OPTIMIZED_SPACING.largeDevice.minWhiteExtensionHeight;
  }
};

/**
 * Calculates category button positioning within the white extension area
 * Determines the bottom position for absolute positioning
 * 
 * @param whiteExtensionHeight - Height of the white extension area
 * @param categoryButtonHeight - Height of the category button
 * @param isSmallDevice - Whether the device is considered small
 * @returns Bottom position value for absolute positioning
 */
export const calculateCategoryPosition = (
  whiteExtensionHeight: number,
  categoryButtonHeight: number,
  isSmallDevice: boolean
): number => {
  try {
    // Input validation
    if (whiteExtensionHeight <= 0 || categoryButtonHeight <= 0) {
      return isSmallDevice ? SPACING.XXL : SPACING.XXXL; // Fallback to current positioning
    }

    // Get device-specific spacing
    const spacing = isSmallDevice ? OPTIMIZED_SPACING.smallDevice : OPTIMIZED_SPACING.largeDevice;

    // Calculate bottom position: bottom padding from white extension area
    return spacing.bottomPadding;

  } catch (error) {
    // Fallback to current positioning
    return isSmallDevice ? SPACING.XXL : SPACING.XXXL;
  }
};

/**
 * Gets optimal spacing configuration for device type
 * Provides device-specific padding values for responsive design
 * 
 * @param isSmallDevice - Whether the device is considered small
 * @returns Optimal spacing configuration object
 */
export const getOptimalSpacing = (isSmallDevice: boolean): OptimalSpacing => {
  const config = isSmallDevice ? OPTIMIZED_SPACING.smallDevice : OPTIMIZED_SPACING.largeDevice;

  return {
    topPadding: config.topPadding,
    bottomPadding: config.bottomPadding,
    leftPadding: config.leftPadding,
    rightPadding: 0, // No right padding needed for absolute positioning
  };
};

/**
 * Calculates complete category button dimensions for layout optimization
 * Combines text height, padding, and spacing calculations
 * 
 * @param categoryText - The category text content
 * @param fontSize - Font size in pixels
 * @param fontWeight - Font weight string
 * @param paddingHorizontal - Horizontal padding in pixels
 * @param paddingVertical - Vertical padding in pixels
 * @returns Complete dimension calculations
 */
export const calculateCategoryButtonDimensions = (
  categoryText: string,
  fontSize: number,
  fontWeight: string,
  paddingHorizontal: number,
  paddingVertical: number
): CategoryButtonDimensions => {
  try {
    // Calculate text height
    const textHeight = calculateCategoryTextHeight(categoryText, fontSize, fontWeight);

    // Calculate total button height including padding
    const buttonHeight = textHeight + (paddingVertical * 2);

    // Estimate button width (rough calculation for layout purposes)
    const avgCharWidth = fontSize * 0.6; // Approximate character width
    const textWidth = categoryText.length * avgCharWidth;
    const buttonWidth = textWidth + (paddingHorizontal * 2);

    // Calculate total height including all spacing
    const totalHeight = buttonHeight;

    return {
      textHeight,
      buttonHeight,
      buttonWidth,
      totalHeight,
    };

  } catch (error) {
    // Fallback dimensions
    return {
      textHeight: fontSize || TYPOGRAPHY.FONT_SIZE.SMALL,
      buttonHeight: (fontSize || TYPOGRAPHY.FONT_SIZE.SMALL) + (paddingVertical * 2),
      buttonWidth: 100, // Safe fallback width
      totalHeight: (fontSize || TYPOGRAPHY.FONT_SIZE.SMALL) + (paddingVertical * 2),
    };
  }
};

/**
 * Performance-optimized spacing constants for quick access
 * Avoids repeated object creation in render cycles
 */
export const SPACING_CONSTANTS = {
  SMALL_DEVICE_TOP_PADDING: OPTIMIZED_SPACING.smallDevice.topPadding,
  SMALL_DEVICE_BOTTOM_PADDING: OPTIMIZED_SPACING.smallDevice.bottomPadding,
  LARGE_DEVICE_TOP_PADDING: OPTIMIZED_SPACING.largeDevice.topPadding,
  LARGE_DEVICE_BOTTOM_PADDING: OPTIMIZED_SPACING.largeDevice.bottomPadding,
  MIN_WHITE_EXTENSION_HEIGHT_SMALL: OPTIMIZED_SPACING.smallDevice.minWhiteExtensionHeight,
  MIN_WHITE_EXTENSION_HEIGHT_LARGE: OPTIMIZED_SPACING.largeDevice.minWhiteExtensionHeight,
} as const;