/**
 * CommonStyles - Eliminates duplicate styling patterns
 * 
 * This utility provides reusable style objects to replace
 * the identical flex and layout patterns found in 100+ locations across:
 * - All component StyleSheet definitions
 * - Screen layout implementations
 * - Card and container components
 * 
 * Evidence: Identical flex: 1, justifyContent: 'center', alignItems: 'center' patterns
 * Solution: Centralized reusable style objects reducing code duplication
 */

import { StyleSheet, ViewStyle } from 'react-native';

export const COMMON_STYLES = StyleSheet.create({
  // Flex container styles
  flex1: {
    flex: 1,
  } as ViewStyle,

  flexCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,

  flexRow: {
    flexDirection: 'row',
    alignItems: 'center',
  } as ViewStyle,

  flexRowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  } as ViewStyle,

  flexRowCenter: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,

  // Common centering patterns
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,

  centerHorizontal: {
    alignItems: 'center',
  } as ViewStyle,

  centerVertical: {
    justifyContent: 'center',
  } as ViewStyle,

  // Common spacing patterns
  spaceBetween: {
    justifyContent: 'space-between',
  } as ViewStyle,

  spaceAround: {
    justifyContent: 'space-around',
  } as ViewStyle,

  spaceEvenly: {
    justifyContent: 'space-evenly',
  } as ViewStyle,

  // Common alignment patterns
  alignStart: {
    alignItems: 'flex-start',
  } as ViewStyle,

  alignEnd: {
    alignItems: 'flex-end',
  } as ViewStyle,

  alignStretch: {
    alignItems: 'stretch',
  } as ViewStyle,

  // Common positioning
  absoluteFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  } as ViewStyle,

  // Container patterns
  fullScreen: {
    flex: 1,
    width: '100%',
    height: '100%',
  } as ViewStyle,

  container: {
    flex: 1,
    backgroundColor: '#fff',
  } as ViewStyle,

  containerPadded: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  } as ViewStyle,
});

/**
 * Utility function to combine common styles with custom styles
 * @param commonStyleKeys - Array of common style keys to apply
 * @param customStyles - Custom styles to merge
 * @returns Combined style object
 */
export const combineStyles = (
  commonStyleKeys: (keyof typeof COMMON_STYLES)[],
  customStyles?: ViewStyle | ViewStyle[]
): ViewStyle => {
  const commonStyles = commonStyleKeys.map(key => COMMON_STYLES[key]);
  const customStyleArray = Array.isArray(customStyles) ? customStyles : [customStyles];
  
  return StyleSheet.flatten([...commonStyles, ...customStyleArray.filter(Boolean)]);
}; 