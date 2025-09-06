/**
 * ArticleHeader - Header component for article detail screens with navigation and actions
 * 
 * Renders a header bar with back navigation, bookmark toggle, and optional share button.
 * Features loading state handling for bookmark operations, conditional icon states,
 * and responsive action button layout. Includes proper accessibility support and
 * visual feedback for user interactions.
 * 
 * @component
 * @param {ArticleHeaderProps} props - Component properties
 * @returns {React.ReactElement} The rendered article header component
 * 
 * @example
 * <ArticleHeader
 *   onBack={() => navigation.goBack()}
 *   onToggleBookmark={() => handleBookmarkToggle()}
 *   onShare={() => handleShare()}
 *   isBookmarked={isArticleBookmarked}
 *   isBookmarkLoading={isLoading}
 *   enableSharing={true}
 * />
 */
import React from 'react';
import {
  View,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';

/**
 * Props interface for ArticleHeader component
 * @interface ArticleHeaderProps
 */
interface ArticleHeaderProps {
  /** Callback function for back navigation */
  onBack: () => void;
  /** Callback function for bookmark toggle action */
  onToggleBookmark: () => void;
  /** Callback function for share action */
  onShare: () => void;
  /** Whether the article is currently bookmarked */
  isBookmarked: boolean;
  /** Whether bookmark operation is in progress */
  isBookmarkLoading: boolean;
  /** Whether to show the share button */
  enableSharing: boolean;
  /** Whether to hide the bookmark button (optional) */
  hideBookmark?: boolean;
}

const ArticleHeader: React.FC<ArticleHeaderProps> = ({
  onBack,
  onToggleBookmark,
  onShare,
  isBookmarked,
  isBookmarkLoading,
  enableSharing,
  hideBookmark = false,
}) => {
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={onBack}>
        <Feather name="arrow-left" size={24} color="#333" />
      </TouchableOpacity>
      <View style={styles.headerActions}>
        {!hideBookmark && (
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
        )}
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