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

interface NewContentNotifierProps {
  onPress: () => void;
  visible: boolean;
}

const NOTIFICATION_HEIGHT = 50;
const SCREEN_WIDTH = Dimensions.get('window').width;

const NewContentNotifier: React.FC<NewContentNotifierProps> = ({ onPress, visible }) => {
  const slideAnim = useRef(new Animated.Value(-NOTIFICATION_HEIGHT)).current;

  useEffect(() => {
    if (visible) {
      // Slide down animation
      Animated.timing(slideAnim, {
        toValue: 60, // Position from top of safe area
        duration: 300,
        useNativeDriver: false,
      }).start();
    } else {
      // Slide up animation
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