import React, { useState, memo, useCallback, useEffect } from 'react';
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
} from 'react-native';
import BranchHelper from '../utils/branchHelper';
// Removed useNavigation as it's not used in Phase 1 card directly
// import { useNavigation } from '@react-navigation/native';
// import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Article } from '../types/supabase';
// import { RootStackParamList } from '../types/navigation'; // Not needed for Phase 1 card
import { Feather } from '@expo/vector-icons'; // Import icons
import { useSavedArticles } from '../context/SavedArticlesContext'; // Import saved articles context
import { toast } from '../utils/toast';

interface NewsCardProps {
  article: Article;
}

const NewsCard: React.FC<NewsCardProps> = memo(({ article }) => {
  // Use window dimensions for responsive layout that updates on orientation change
  const { width: windowWidth } = useWindowDimensions();
  const [isSmallDevice, setIsSmallDevice] = useState(windowWidth < 375);

  // Create styles based on current device size
  const styles = React.useMemo(() => createStyleSheet(isSmallDevice), [isSmallDevice]);

  // Update responsive values when dimensions change (e.g., rotation)
  useEffect(() => {
    setIsSmallDevice(windowWidth < 375);
  }, [windowWidth]);
  // const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>(); // Not needed for Phase 1
  const [showIcons, setShowIcons] = useState(false); // State for icon visibility
  // Get correct functions and state from context
  const { savedArticles, addBookmark, removeBookmark } = useSavedArticles();

  // Derive saved state by checking if the article id exists in the savedArticles array
  const isSaved = savedArticles.some(saved => saved.id === article.id);

  // Function to format timestamp (basic example)
  const formatTimeAgo = (timestamp: string | undefined): string => {
    if (!timestamp) return '';
    // Placeholder: Implement actual time ago logic here using a library like date-fns if needed
    const date = new Date(timestamp);
    const now = new Date();
    const diffHours = Math.abs(now.getTime() - date.getTime()) / 36e5;
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${Math.floor(diffHours)} hours ago`;
    return date.toLocaleDateString(); // Fallback for older dates
  };

  const handleSourceLinkPress = useCallback(() => {
    if (article.source_url) {
      Linking.openURL(article.source_url).catch(err => console.error("Couldn't load page", err));
    }
  }, [article.source_url]);

  // Handle Share action using Branch.io
  const handleShare = useCallback(async () => {
    try {
      const branchLink = await BranchHelper.createShareLink({
        title: article.title,
        description: article.summary || '',
        newsId: article.id,
        category: article.category?.name
      });

      if (branchLink) {
        const message = `${article.title} - Read more on EduShorts app:\n\n${branchLink}`;
        await Share.share({
          message,
          url: branchLink,
          title: article.title,
        });
      } else {
        toast.error('Error creating share link');
      }
    } catch (error: any) {
      console.error('Error sharing article:', error.message);
      toast.error('Error sharing article');
    }
  }, [article]);

  // Handle Save/Unsave action
  const handleSaveToggle = useCallback(() => {
    try {
      if (isSaved) {
        // Use removeBookmark function from context
        removeBookmark(article.id);
        toast.success('Article removed from bookmarks');
      } else {
        // Use addBookmark function from context (takes articleId)
        addBookmark(article.id);
        toast.success('Article saved to bookmarks');
      }
      // Optionally hide icons after action
      // setShowIcons(false);
    } catch (error: any) {
      console.error('Error saving/unsaving article:', error.message);
      toast.error('Error updating bookmarks');
    }
  }, [article.id, isSaved, removeBookmark, addBookmark]);

  return (
    // Root TouchableOpacity for the full card, toggles icons
    <TouchableOpacity
      style={styles.fullScreenCard}
      onPress={() => setShowIcons(prev => !prev)} // Toggle icons on tap
      activeOpacity={1} // Use 1 to prevent visual feedback on the whole card tap
    >
      {/* Image Section */}
      <View style={styles.imageContainer}>
        {article.image_path ? (
          <Image
            source={{ uri: article.image_path }}
            style={styles.cardImage}
            resizeMethod="resize" // More efficient resize method
            progressiveRenderingEnabled={true} // Enable progressive loading
          />
        ) : (
          <View style={[styles.cardImage, styles.noImage]}>
            <Text style={styles.noImageText}>No Image Available</Text>
          </View>
        )}

        {/* Edushorts Logo Overlay */}
        <View style={styles.logoOverlay}>
          <Text style={styles.logoText}>Edushorts</Text>
        </View>
      </View>

      {/* Content Area */}
      <View style={styles.cardContentContainer}>
        {/* Scrollable content within the content area */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          style={styles.scrollView}
          removeClippedSubviews={true} // Improve performance by removing offscreen views
          scrollEventThrottle={16} // Optimize scroll event firing (60fps)
          overScrollMode="never" // Prevent overscroll effect on Android
        >
          {/* Source Tag */}
          <View style={styles.sourceTagContainer}>
            <Text style={styles.sourceTagText} numberOfLines={1}>
              {/* Display Category Name here */}
              {article.category?.name || 'General'}
            </Text>
          </View>

          {/* Timestamp - Moved below category */}
          <Text style={styles.timeText}>{formatTimeAgo(article.created_at)}</Text>

          {/* Title */}
          <Text style={styles.title}>{article.title}</Text>

          {/* Summary */}
          <Text style={styles.summary} numberOfLines={isSmallDevice ? 8 : 10}>{article.summary}</Text>

          {/* Read More Button - Moved below summary */}
          {article.source_url && (
            <TouchableOpacity
              style={styles.readMoreButton}
              onPress={handleSourceLinkPress}
            >
              <Text style={styles.readMoreText}>Read more at {article.source_name || 'Source'}</Text>
              <Feather name="external-link" size={14} color="#ff0000" style={styles.linkIcon} />
            </TouchableOpacity>
          )}

          {/* Add padding at the bottom to ensure content doesn't get hidden */}
          <View style={styles.scrollViewBottomPadding} />
        </ScrollView>

        {/* Removed the fixed position Read More button */}
      </View>

      {/* Interaction Icons - Conditionally Rendered Overlay */}
      {showIcons && (
        <View style={styles.interactionContainer}>
          {/* Save Icon */}
          <TouchableOpacity onPress={handleSaveToggle} style={styles.iconButton}>
            {/* Change icon based on saved state */}
            <Feather name={isSaved ? "bookmark" : "bookmark"} size={28} color={isSaved ? "#ff0000" : "#333"} />
            {/* Using same icon but changing color. Could use different icons if available */}
          </TouchableOpacity>
          {/* Share Icon */}
          <TouchableOpacity onPress={handleShare} style={styles.iconButton}>
            <Feather name="share-2" size={28} color="#333" />
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );
});

// Get static dimensions for initial layout
const { height, width } = Dimensions.get('window');

// Create a StyleSheet factory function for responsive styles
const createStyleSheet = (smallDevice: boolean) => StyleSheet.create({
  fullScreenCard: {
    flex: 1, // Make card fill the SafeAreaView in HomeScreen
    backgroundColor: 'white',
    height: height, // Explicitly set height
    width: width,   // Explicitly set width
  },
  cardImage: {
    width: '100%',
    height: height * (smallDevice ? 0.3 : 0.35), // Adjust height based on device size
    resizeMode: 'cover', // Ensure image covers the area
  },
  imageContainer: {
    position: 'relative', // For absolute positioning of children
    width: '100%',
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
    backgroundColor: '#e0e0e0', // Slightly darker grey for placeholder
    justifyContent: 'center',
    alignItems: 'center',
  },
  noImageText: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
  },
  cardContentContainer: {
    flex: 1.5, // Increased from 1 to 1.5 to give more space to content
    // Position absolutely to overlay image slightly if needed, or use negative margin
    marginTop: -20, // Pull the container up to overlap the image
    backgroundColor: 'white', // Ensure background is white
    borderTopLeftRadius: 20, // Added curve to top-left corner
    borderTopRightRadius: 20, // Added curve to top-right corner
    paddingBottom: 20, // Add padding at the very bottom
    position: 'relative', // Ensure proper positioning for absolute elements
  },
  scrollView: {
    paddingHorizontal: smallDevice ? 16 : 20, // Adjust horizontal padding based on device size
    paddingTop: 40,       // Increased padding to compensate for negative margin (20 + 20)
    paddingBottom: 20,    // Add padding at bottom
  },
  scrollViewBottomPadding: {
    height: 20, // Extra padding at the bottom of the ScrollView content
  },

  sourceTagContainer: {
    backgroundColor: '#ff0000', // Changed to red background
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 6, // Slightly less rounded corners
    alignSelf: 'flex-start', // Align tag to the left
    marginBottom: 15,      // Space below the tag
  },
  sourceTagText: {
    color: '#ffffff', // Changed to white text
    fontSize: 14,
    fontWeight: '500',
  },
  title: {
    fontSize: smallDevice ? 22 : 24, // Adjust font size based on device size
    fontWeight: 'bold', // Bold title
    marginBottom: 12, // Increased space below title
    color: '#333333', // Dark text color
    lineHeight: smallDevice ? 28 : 30, // Adjust line height based on device size
  },
  summary: {
    fontSize: smallDevice ? 15 : 16, // Adjust font size based on device size
    color: '#666666', // Medium grey text color
    lineHeight: smallDevice ? 22 : 24, // Adjust line height based on device size
    marginBottom: 16, // Space below summary
    marginTop: 4, // Added small space above summary
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
    paddingVertical: 4, // Added vertical padding for better touch target
  },
  readMoreText: {
    fontSize: smallDevice ? 14 : 15,
    color: '#ff0000',
    fontWeight: '600',
    letterSpacing: 0.2, // Slightly increase letter spacing for better readability
  },
  linkIcon: {
    marginLeft: 8,
  },
  interactionContainer: {
    position: 'absolute', // Position over the content
    bottom: 30,           // Distance from bottom
    right: 20,            // Distance from right
    // Removed flexDirection: 'column' and alignItems: 'center' if icons are side-by-side
    // If icons should be vertical, uncomment below:
    flexDirection: 'column',
    alignItems: 'center',
  },
  iconButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)', // Slightly less transparent background
    padding: 12,          // Padding around the icon
    borderRadius: 30,     // Make it circular (increased size)
    // If icons are vertical:
    marginBottom: 15,     // Space between vertical icons
    // If icons are horizontal:
    // marginLeft: 15,    // Space between horizontal icons
    // Adding some shadow for depth
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
  },
});

export default NewsCard;
