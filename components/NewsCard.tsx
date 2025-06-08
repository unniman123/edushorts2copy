import React, { useState, memo, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  Linking,
  Share,
  useWindowDimensions,
  InteractionManager,
} from 'react-native';
import ImageOptimizer from '../utils/ImageOptimizer';
import PerformanceMonitoringService from '../services/PerformanceMonitoringService';
import { Article } from '../types/supabase';
import { Feather, Ionicons } from '@expo/vector-icons'; 
import { useSavedArticles } from '../context/SavedArticlesContext'; 
import { showToast } from '../utils/toast'; 
import DeepLinkHandler from '../services/DeepLinkHandler';

interface NewsCardProps {
  article: Article;
}

const NewsCard: React.FC<NewsCardProps> = memo(({ article }) => {
  const { width: windowWidth } = useWindowDimensions();
  const [isSmallDevice, setIsSmallDevice] = useState(windowWidth < 375);
  const [imageLoaded, setImageLoaded] = useState(false);
  const imageOptimizer = useRef(ImageOptimizer.getInstance());
  const performanceMonitor = useRef(PerformanceMonitoringService.getInstance());
  const imageLoadStartTime = useRef(0);

  const styles = React.useMemo(() => createStyleSheet(isSmallDevice), [isSmallDevice]);

  useEffect(() => {
    setIsSmallDevice(windowWidth < 375);
  }, [windowWidth]);

  useEffect(() => {
    if (article.image_path && typeof article.image_path === 'string') {
      const loadImage = async () => {
        try {
          imageLoadStartTime.current = Date.now();
          await imageOptimizer.current.preloadImage(article.image_path!);
          
          InteractionManager.runAfterInteractions(() => {
            setImageLoaded(true);
              const loadTime = Date.now() - imageLoadStartTime.current;
              performanceMonitor.current.recordImageLoad(article.image_path!, loadTime, 0);
          });
        } catch (error) {
          console.error('Failed to preload image:', error);
          setImageLoaded(true);
        }
      };

      loadImage();
    }

    return () => {
      setImageLoaded(false);
    };
  }, [article.image_path]);

  const [showIcons, setShowIcons] = useState(false);
  const { savedArticles, addBookmark, removeBookmark } = useSavedArticles();

  const isSaved = savedArticles.some(saved => saved.id === article.id);

  const formatTimeAgo = (timestamp: string | undefined): string => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diffHours = Math.abs(now.getTime() - date.getTime()) / 36e5;
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${Math.floor(diffHours)} hours ago`;
    return date.toLocaleDateString();
  };

  const handleSourceLinkPress = useCallback(() => {
    if (article.source_url) {
      Linking.openURL(article.source_url).catch(err => console.error("Couldn't load page", err));
    }
  }, [article.source_url]);

  const handleShare = useCallback(async () => {
    try {
      const deepLinkHandler = DeepLinkHandler.getInstance();
      
      const branchUrl = await deepLinkHandler.createBranchLink(
        article.id,
        article.title,
        article.summary,
        article.image_path || undefined
      );

      const message = `Check out this article in Edushorts: ${article.title}\n\n${branchUrl}`;

      await Share.share({
        message: message,
        url: branchUrl,
        title: article.title,
      });
      
      deepLinkHandler.trackArticleShare(article.id, 'news_card');
      
    } catch (error: any) {
      console.error('Error sharing article:', error.message);
      showToast('error', 'Error sharing article');
    }
  }, [article.id, article.title, article.summary, article.image_path]);

  const handleSaveToggle = useCallback(() => {
    try {
      if (isSaved) {
        removeBookmark(article.id);
        showToast('success', 'Article removed from bookmarks');
      } else {
        addBookmark(article.id);
        showToast('success', 'Article saved to bookmarks');
      }
    } catch (error: any) {
      console.error('Error saving/unsaving article:', error.message);
      showToast('error', 'Error updating bookmarks');
    }
  }, [article.id, isSaved, removeBookmark, addBookmark]);

  return (
    <TouchableOpacity
      style={styles.fullScreenCard}
      onPress={() => setShowIcons(prev => !prev)}
      activeOpacity={0.98}
    >
      <View style={styles.imageContainer}>
        {article.image_path ? (
          <Image
            source={{ uri: article.image_path }}
            style={[styles.cardImage, !imageLoaded && styles.imageLoading]}
            resizeMethod="resize"
            progressiveRenderingEnabled={true}
            onLoadStart={() => {
              imageLoadStartTime.current = Date.now();
            }}
            onLoad={() => {
              const loadTime = Date.now() - imageLoadStartTime.current;
              performanceMonitor.current.recordImageLoad(article.image_path!, loadTime, 0);
              setImageLoaded(true);
            }}
            onError={() => {
              setImageLoaded(true); 
            }}
          />
        ) : (
          <View style={[styles.cardImage, styles.noImage]}>
            <Text style={styles.noImageText}>No Image Available</Text>
          </View>
        )}
        <View style={styles.logoOverlay}>
          <Text style={styles.logoText}>Edushorts</Text>
        </View>
      </View>

      <View style={styles.cardContentContainer}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          style={styles.scrollView}
          removeClippedSubviews={true} 
          scrollEventThrottle={16} 
          overScrollMode="never" 
        >
          <View style={styles.sourceTagContainer}>
            <Text style={styles.sourceTagText} numberOfLines={1}>
              {article.category?.name || 'General'}
            </Text>
          </View>
          <Text style={styles.timeText}>{formatTimeAgo(article.created_at)}</Text>
          <Text style={styles.title}>{article.title}</Text>
          <Text style={styles.summary} numberOfLines={isSmallDevice ? 8 : 10}>{article.summary}</Text>
          {article.source_url && (
            <TouchableOpacity
              style={styles.readMoreButton}
              onPress={handleSourceLinkPress}
            >
              <Text style={styles.readMoreText}>Read more at {article.source_name || 'Source'}</Text>
              <Feather name="external-link" size={14} color="#ff0000" style={styles.linkIcon} />
            </TouchableOpacity>
          )}
          <View style={styles.scrollViewBottomPadding} />
        </ScrollView>
      </View>

      {showIcons && (
        <View style={styles.interactionContainer}>
          <TouchableOpacity onPress={handleSaveToggle} style={styles.iconButton}>
            <Ionicons name={isSaved ? "bookmark" : "bookmark-outline"} size={28} color={isSaved ? "#ff0000" : "#333"} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleShare} style={styles.iconButton}>
            <Feather name="share-2" size={28} color="#333" />
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );
});

const { height, width } = Dimensions.get('window');

const createStyleSheet = (smallDevice: boolean) => StyleSheet.create({
  fullScreenCard: {
    flex: 1, 
    backgroundColor: 'white',
    height: height, 
    width: width,   
  },
  cardImage: {
    width: '100%',
    height: height * (smallDevice ? 0.3 : 0.35), 
    resizeMode: 'cover', 
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    backgroundColor: '#f0f0f0', 
  },
  imageLoading: {
    opacity: 0.7,
  },
  logoOverlay: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  logoText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  noImage: {
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noImageText: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
  },
  cardContentContainer: {
    flex: 1.5, 
    marginTop: -20, 
    backgroundColor: 'white', 
    borderTopLeftRadius: 20, 
    borderTopRightRadius: 20, 
    paddingBottom: 20, 
    position: 'relative',
  },
  scrollView: {
    paddingHorizontal: smallDevice ? 16 : 20, 
    paddingTop: 40,       
    paddingBottom: 20,    
  },
  scrollViewBottomPadding: {
    height: 20, 
  },
  sourceTagContainer: {
    backgroundColor: '#ff0000',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 15,      
  },
  sourceTagText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  title: {
    fontSize: smallDevice ? 22 : 24,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333333',
    lineHeight: smallDevice ? 28 : 30,
  },
  summary: {
    fontSize: smallDevice ? 15 : 16,
    color: '#666666',
    lineHeight: smallDevice ? 22 : 24,
    marginBottom: 16,
    marginTop: 4,
    fontWeight: 'normal',
  },
  timeText: {
    fontSize: smallDevice ? 11 : 12,
    color: '#666666',
    marginTop: 4,
    marginBottom: smallDevice ? 8 : 10,
  },
  readMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: smallDevice ? 10 : 12,
    marginBottom: smallDevice ? 16 : 20,
    paddingVertical: 4, 
  },
  readMoreText: {
    fontSize: smallDevice ? 14 : 15,
    color: '#ff0000',
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  linkIcon: {
    marginLeft: 8,
  },
  interactionContainer: {
    position: 'absolute',
    bottom: 30,           
    right: 20,            
    flexDirection: 'column',
    alignItems: 'center',
  },
  iconButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    padding: 12,          
    borderRadius: 30,     
    marginBottom: 15,     
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
  },
});

export default NewsCard;
