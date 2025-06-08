import React from 'react';
import {
  View,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';

interface ArticleHeaderProps {
  onBack: () => void;
  onToggleBookmark: () => void;
  onShare: () => void;
  isBookmarked: boolean;
  isBookmarkLoading: boolean;
  enableSharing: boolean;
}

const ArticleHeader: React.FC<ArticleHeaderProps> = ({
  onBack,
  onToggleBookmark,
  onShare,
  isBookmarked,
  isBookmarkLoading,
  enableSharing,
}) => {
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={onBack}>
        <Feather name="arrow-left" size={24} color="#333" />
      </TouchableOpacity>
      <View style={styles.headerActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={onToggleBookmark}
          disabled={isBookmarkLoading}
        >
          {isBookmarkLoading ? (
            <ActivityIndicator size="small" color="#ff0000" />
          ) : (
            <Ionicons
              name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
              size={24}
              color={isBookmarked ? '#ff0000' : '#333'}
            />
          )}
        </TouchableOpacity>
        {enableSharing && (
          <TouchableOpacity style={styles.actionButton} onPress={onShare}>
            <Feather name="share" size={22} color="#333" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
  },
  headerActions: {
    flexDirection: 'row',
  },
  actionButton: {
    marginLeft: 20,
  },
});

export default ArticleHeader; 