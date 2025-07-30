/**
 * ArticleContent - Full article content display component with dynamic layout
 * 
 * Renders complete article content including hero image, title, publisher information,
 * summary, full content, and source link. Features dynamic layout optimization based
 * on source icon presence, memoized timestamp calculations for performance, and
 * fallback handling for missing images. Includes proper content hierarchy and
 * responsive text sizing.
 * 
 * @component
 * @param {ArticleContentProps} props - Component properties
 * @returns {React.ReactElement} The rendered article content component
 * 
 * @example
 * <ArticleContent
 *   article={articleData}
 *   showSourceIcon={true}
 *   maxSummaryLength={200}
 * />
 */
import React, { memo, useMemo } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Article } from '../../types/supabase';
import { getRelativeTime } from '../../utils/timeUtils';

/**
 * Props interface for ArticleContent component
 * @interface ArticleContentProps
 */
interface ArticleContentProps {
  /** Article data containing all content and metadata */
  article: Article;
  /** Whether to display the source icon in publisher section */
  showSourceIcon: boolean;
  /** Maximum length for summary text (currently unused but available for future truncation) */
  maxSummaryLength: number;
}

const ArticleContent: React.FC<ArticleContentProps> = memo(({
  article,
  showSourceIcon,
  maxSummaryLength,
}) => {
  /**
   * Memoized timestamp calculation for performance optimization
   * Prevents unnecessary recalculation of relative time on every render
   * @returns {string} Formatted relative time string
   */
  const memoizedTimestamp = useMemo(() => {
    return getRelativeTime(article.created_at);
  }, [article.created_at]);
  
  /**
   * Article summary text (currently displays full summary without truncation)
   * @constant {string}
   */
  const truncatedSummary = article.summary;

  /**
   * Dynamic publisher container styles based on source icon presence
   * Adjusts layout when source icon is hidden for optimal space utilization
   * @constant {Array}
   */
  const publisherContainerStyle = [
    styles.publisherContainer,
    !showSourceIcon && styles.publisherContainerNoIcon,
  ];

  /**
   * Dynamic publisher info styles based on source icon presence
   * Optimizes text layout when icon is not displayed
   * @constant {Array}
   */
  const publisherInfoStyle = [
    styles.publisherInfo,
    !showSourceIcon && styles.publisherInfoNoIcon,
  ];

  return (
    <View>
      <View style={styles.heroContainer}>
        {article.image_path ? (
          <Image source={{ uri: article.image_path }} style={styles.heroImage} />
        ) : (
          <View style={[styles.heroImage, styles.noHeroImage]}>
            <Feather name="image" size={40} color="#ccc" />
            <Text style={styles.noImageText}>No Image Available</Text>
          </View>
        )}
      </View>
      <View style={styles.contentContainer}>
        <Text style={styles.title}>{article.title}</Text>
        <View style={publisherContainerStyle}>
          {showSourceIcon && article.source_icon && (
            <Image
              source={{ uri: article.source_icon }}
              style={styles.publisherIcon}
            />
          )}
          <View style={publisherInfoStyle}>
            <Text style={styles.publisherName}>{article.source_name}</Text>
            <Text style={styles.publishDate}>
              {memoizedTimestamp}
            </Text>
          </View>
        </View>
        <Text style={styles.summary}>{truncatedSummary}</Text>
        <View style={styles.divider} />
        <Text style={styles.content}>{article.content}</Text>
        {article.source_url && (
          <TouchableOpacity
            style={styles.sourceLink}
            onPress={() => Linking.openURL(article.source_url!)}
          >
            <Text style={styles.sourceLinkText}>Read Full Story</Text>
            <Feather name="external-link" size={16} color="#ff0000" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  heroContainer: {
    width: '100%',
    height: 250,
    backgroundColor: '#f0f0f0',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  noHeroImage: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  noImageText: {
    fontSize: 16,
    color: '#888',
    marginTop: 8,
  },
  contentContainer: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 12,
  },
  publisherContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  publisherContainerNoIcon: {
    justifyContent: 'flex-start',
  },
  publisherIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  publisherInfo: {
    flex: 1,
  },
  publisherInfoNoIcon: {
    flex: 0,
    alignSelf: 'flex-start',
  },
  publisherName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  },
  publishDate: {
    fontSize: 12,
    color: '#666666',
    marginTop: 2,
  },
  summary: {
    fontSize: 16,
    lineHeight: 24,
    color: '#555',
    marginVertical: 10,
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 16,
  },
  content: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
  },
  sourceLink: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
  },
  sourceLinkText: {
    fontSize: 14,
    color: '#ff0000',
    fontWeight: '600',
    marginRight: 6,
  },
});

export default ArticleContent; 