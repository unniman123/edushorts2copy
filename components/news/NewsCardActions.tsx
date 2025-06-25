import React, { memo, useCallback } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS, ELEVATION } from '../../constants/theme';

interface NewsCardActionsProps {
  isSaved: boolean;
  onSaveToggle: () => void;
  onShare: () => void;
}

const NewsCardActions: React.FC<NewsCardActionsProps> = memo(({ isSaved, onSaveToggle, onShare }) => {
  const handleSaveToggle = useCallback(() => {
    onSaveToggle();
  }, [onSaveToggle]);

  const handleShare = useCallback(() => {
    onShare();
  }, [onShare]);

  return (
    <View style={styles.interactionContainer}>
      <TouchableOpacity onPress={handleSaveToggle} style={styles.iconButton}>
        <Ionicons 
          name={isSaved ? "bookmark" : "bookmark-outline"} 
          size={28} 
          color={isSaved ? COLORS.PRIMARY : COLORS.GRAY_900} 
        />
      </TouchableOpacity>
      <TouchableOpacity onPress={handleShare} style={styles.iconButton}>
        <Feather name="share-2" size={28} color={COLORS.GRAY_900} />
      </TouchableOpacity>
    </View>
  );
});

NewsCardActions.displayName = 'NewsCardActions';

const styles = StyleSheet.create({
  interactionContainer: {
    position: 'absolute',
    bottom: SPACING.XLARGE,
    right: SPACING.XXXXL,
    flexDirection: 'column',
    alignItems: 'center',
  },
  iconButton: {
    backgroundColor: COLORS.BACKGROUND_CARD,
    padding: SPACING.LG,
    borderRadius: BORDER_RADIUS.CIRCLE,
    marginBottom: SPACING.XL,
    ...ELEVATION.LOW,
  },
});

export default NewsCardActions; 