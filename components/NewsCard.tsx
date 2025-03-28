import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions, // Import Dimensions
  ScrollView, // Import ScrollView
  Linking, // Import Linking for source URL
} from 'react-native';
// Removed useNavigation as it's not used in Phase 1 card directly
// import { useNavigation } from '@react-navigation/native';
// import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Article } from '../types/supabase';
// import { RootStackParamList } from '../types/navigation'; // Not needed for Phase 1 card
import { Feather } from '@expo/vector-icons'; // Import icons

interface NewsCardProps {
  article: Article;
}

const NewsCard: React.FC<NewsCardProps> = ({ article }) => {
  // const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>(); // Not needed for Phase 1
  const [showIcons, setShowIcons] = useState(false); // State for icon visibility

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

  const handleSourceLinkPress = () => {
    if (article.source_url) {
      Linking.openURL(article.source_url).catch(err => console.error("Couldn't load page", err));
    }
  };

  return (
    // Root TouchableOpacity for the full card, toggles icons
    <TouchableOpacity
      style={styles.fullScreenCard}
      onPress={() => setShowIcons(prev => !prev)} // Toggle icons on tap
      activeOpacity={1} // Use 1 to prevent visual feedback on the whole card tap
    >
      {/* Image Section */}
      {article.image_path ? (
        <Image
          source={{ uri: article.image_path }}
          style={styles.cardImage}
        />
      ) : (
        <View style={[styles.cardImage, styles.noImage]}>
          <Text style={styles.noImageText}>No Image Available</Text>
        </View>
      )}

      {/* Content Area */}
      <View style={styles.cardContentContainer}>
        {/* Scrollable content within the content area */}
        <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
          {/* Source Tag */}
          <View style={styles.sourceTagContainer}>
            <Text style={styles.sourceTagText}>
              {article.source_name || 'News Source'}
            </Text>
          </View>

          {/* Title */}
          <Text style={styles.title}>{article.title}</Text>

          {/* Summary */}
          <Text style={styles.summary}>{article.summary}</Text>

          {/* Timestamp and Source Link */}
          <TouchableOpacity onPress={handleSourceLinkPress} disabled={!article.source_url}>
            <Text style={styles.sourceLinkText}>
              Read more at {article.source_name || 'Source'} / {formatTimeAgo(article.created_at)}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Interaction Icons - Conditionally Rendered Overlay */}
      {showIcons && (
        <View style={styles.interactionContainer}>
          {/* Save Icon */}
          <TouchableOpacity onPress={() => console.log('Save Pressed (Phase 1)')} style={styles.iconButton}>
            <Feather name="bookmark" size={28} color="#333" />
          </TouchableOpacity>
          {/* Share Icon */}
          <TouchableOpacity onPress={() => console.log('Share Pressed (Phase 1)')} style={styles.iconButton}>
            <Feather name="share-2" size={28} color="#333" />
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );
};

const { height, width } = Dimensions.get('window');

const styles = StyleSheet.create({
  fullScreenCard: {
    flex: 1, // Make card fill the SafeAreaView in HomeScreen
    backgroundColor: 'white',
    height: height, // Explicitly set height
    width: width,   // Explicitly set width
  },
  cardImage: {
    width: '100%',
    height: height * 0.45, // Image takes top 45% of the screen height
    resizeMode: 'cover', // Ensure image covers the area
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
    flex: 1, // Take remaining vertical space
    // Position absolutely to overlay image slightly if needed, or use negative margin
    // For simplicity, let's keep it below the image for now.
    backgroundColor: 'white', // Ensure background is white
    paddingBottom: 20, // Add padding at the very bottom
  },
  scrollView: {
    paddingHorizontal: 20, // Horizontal padding for content
    paddingTop: 20,       // Padding above the source tag
  },
  sourceTagContainer: {
    backgroundColor: '#eeeeee', // Light grey background like image
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 15, // More rounded corners
    alignSelf: 'flex-start', // Align tag to the left
    marginBottom: 15,      // Space below the tag
  },
  sourceTagText: {
    color: '#555555', // Darker grey text
    fontSize: 14,
    fontWeight: '500',
  },
  title: {
    fontSize: 22, // Larger title font size
    fontWeight: 'bold', // Bold title
    marginBottom: 10, // Increased space below title
    color: '#333333', // Dark text color
    lineHeight: 28, // Adjust line height for better readability
  },
  summary: {
    fontSize: 16, // Larger summary font size
    color: '#666666', // Medium grey text color
    lineHeight: 24, // Adjust line height
    marginBottom: 20, // Increased space below summary
  },
  sourceLinkText: {
    fontSize: 12,
    color: '#a0a0a0', // Lighter grey color like image
    fontWeight: '400',
    marginTop: 10, // Space above the link text
    marginBottom: 20, // Add space below the link text before potential icon overlap
  },
  interactionContainer: {
    position: 'absolute', // Position over the content
    bottom: 30,           // Distance from bottom (increased)
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
