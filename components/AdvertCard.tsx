import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Advertisement } from '../types/advertisement';
import { advertisementService } from '../services/advertisementService';
import { showToast } from '../utils/toast';

interface AdvertCardProps {
  advertisement: Advertisement;
}

const AdvertCard: React.FC<AdvertCardProps> = ({ advertisement }) => {
  const { width: windowWidth } = useWindowDimensions();
  const [isSmallDevice, setIsSmallDevice] = useState(windowWidth < 375);

  const styles = React.useMemo(() => createStyleSheet(isSmallDevice), [isSmallDevice]);

  useEffect(() => {
    setIsSmallDevice(windowWidth < 375);
  }, [windowWidth]);

  useEffect(() => {
    if (advertisement.id) {
      advertisementService.trackAdImpression(advertisement.id);
    }
  }, [advertisement.id]);

  const handleCtaPress = useCallback(async () => {
    try {
      if (advertisement.id && advertisement.cta_link) {
        await advertisementService.handleAdClick(advertisement.id, advertisement.cta_link);
      }
    } catch (error) {
      console.error('Error handling CTA click:', error);
      showToast('error', 'Failed to open link');
    }
  }, [advertisement.id, advertisement.cta_link]);

  return (
    <TouchableOpacity
      style={styles.fullScreenCard}
      activeOpacity={0.95}
      onPress={handleCtaPress} // Make the entire card clickable
    >
      {/* Full Screen Image with Overlays */}
      <View style={styles.imageContainer}>
        {advertisement.image_path ? (
          <Image
            source={{ uri: advertisement.image_path }}
            style={styles.cardImage}
            resizeMethod="resize"
            progressiveRenderingEnabled={true}
          />
        ) : (
          <View style={[styles.cardImage, styles.noImage]}>
            <Text style={styles.noImageText}>Advertisement</Text>
          </View>
        )}

        {/* Sponsored Tag */}
        <View style={styles.sponsoredOverlay}>
          <Text style={styles.sponsoredText}>Sponsored</Text>
        </View>

        {/* Gradient Overlay for better text visibility */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.7)']}
          style={styles.gradientOverlay}
        />

        {/* Title Overlay */}
        <View style={styles.titleOverlay}>
          <Text style={styles.title}>{advertisement.title}</Text>
        </View>

        {/* CTA Button Overlay */}
        <TouchableOpacity
          style={styles.ctaButton}
          onPress={handleCtaPress}
        >
          <Text style={styles.ctaText}>
            {advertisement.cta_text || 'Learn More'}
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const { height, width } = Dimensions.get('window');

const createStyleSheet = (smallDevice: boolean) => StyleSheet.create({
  fullScreenCard: {
    flex: 1,
    backgroundColor: 'black', // Changed to black for better edge blending
    height: height,
    width: width,
  },
  cardImage: {
    width: '100%',
    height: height, // Full screen height
    resizeMode: 'cover',
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: '100%', // Full container height
  },
  sponsoredOverlay: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    zIndex: 10,
  },
  sponsoredText: {
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
  gradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%', // Cover bottom half of the image
    zIndex: 5,
  },
  titleOverlay: {
    position: 'absolute',
    bottom: smallDevice ? 120 : 150, // Position above the CTA button
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    alignItems: 'center',
    zIndex: 10, // Above the gradient
  },
  title: {
    fontSize: smallDevice ? 24 : 28,
    fontWeight: 'bold',
    color: '#ffffff', // White text for better visibility on image
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3, // Text shadow for better visibility on any background
  },
  ctaButton: {
    position: 'absolute',
    bottom: smallDevice ? 50 : 70, // Position from bottom
    alignSelf: 'center', // Center horizontally
    backgroundColor: '#ff0000',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 30,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    zIndex: 10,
    // Add a border for better visibility on any background
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  ctaText: {
    color: '#ffffff',
    fontSize: smallDevice ? 16 : 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default AdvertCard;
