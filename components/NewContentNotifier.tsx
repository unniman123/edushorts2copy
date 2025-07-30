/**
 * NewContentNotifier - Animated notification banner for new content availability
 * 
 * Displays a slide-down notification banner that appears when new content is available.
 * Features smooth slide animations using React Native Animated API and positions itself
 * at the top of the screen with proper z-index layering. The notification includes a
 * refresh icon and call-to-action text to encourage users to refresh their feed.
 * 
 * @component
 * @param {NewContentNotifierProps} props - Component properties
 * @returns {React.ReactElement} The rendered new content notifier component
 * 
 * @example
 * <NewContentNotifier
 *   visible={hasNewContent}
 *   onPress={() => refreshFeed()}
 * />
 */
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS, ELEVATION, TYPOGRAPHY } from '../constants/theme';

/**
 * Props interface for NewContentNotifier component
 * @interface NewContentNotifierProps
 */
interface NewContentNotifierProps {
  /** Callback function called when the notification banner is pressed */
  onPress: () => void;
  /** Controls the visibility and animation state of the notification */
  visible: boolean;
}

/**
 * Height constant for the notification banner
 * @constant {number}
 */
const NOTIFICATION_HEIGHT = 50;

/**
 * Screen width for responsive positioning
 * @constant {number}
 */
const SCREEN_WIDTH = Dimensions.get('window').width;

const NewContentNotifier: React.FC<NewContentNotifierProps> = ({ onPress, visible }) => {
  /**
   * Animated value for controlling slide animation
   * Starts at negative height (hidden above screen)
   * @type {Animated.Value}
   */
  const slideAnim = useRef(new Animated.Value(-NOTIFICATION_HEIGHT)).current;

  /**
   * Effect to handle slide animation based on visibility
   * Slides down when visible, slides up when hidden
   * @param {boolean} visible - Controls animation direction
   */
  useEffect(() => {
    if (visible) {
      // Slide down animation - moves notification into view
      Animated.timing(slideAnim, {
        toValue: 60, // Position from top of safe area
        duration: 300,
        useNativeDriver: false,
      }).start();
    } else {
      // Slide up animation - hides notification above screen
      Animated.timing(slideAnim, {
        toValue: -NOTIFICATION_HEIGHT,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  }, [visible, slideAnim]);

  return (
    <Animated.View style={[styles.container, { top: slideAnim }]}>
      <TouchableOpacity
        style={styles.button}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <Feather name="refresh-cw" size={18} color={COLORS.WHITE} style={styles.icon} />
        <Text style={styles.text}>New Feed Available</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: SPACING.XXXXL,
    right: SPACING.XXXXL,
    zIndex: 1000,
    elevation: 10,
  },
  button: {
    backgroundColor: COLORS.INFO,
    paddingHorizontal: SPACING.XXXXL,
    paddingVertical: SPACING.LG,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    ...ELEVATION.MEDIUM,
  },
  icon: {
    marginRight: SPACING.MD,
  },
  text: {
    color: COLORS.WHITE,
    fontSize: TYPOGRAPHY.FONT_SIZE.LARGE,
    fontWeight: TYPOGRAPHY.FONT_WEIGHT.MEDIUM,
  },
});

export default NewContentNotifier; 