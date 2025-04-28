import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  Linking,
  useWindowDimensions,
} from 'react-native';
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
      activeOpacity={1}
    >
      {/* Image Section */}
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
      </View>

      {/* Content Area */}
      <View style={styles.cardContentContainer}>
        {/* Title */}
        <Text style={styles.title}>{advertisement.title}</Text>

        {/* CTA Button */}
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
    backgroundColor: 'white',
    height: height,
    width: width,
  },
  cardImage: {
    width: '100%',
    height: height * (smallDevice ? 0.5 : 0.6),
    resizeMode: 'cover',
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
  },
  sponsoredOverlay: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
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
  cardContentContainer: {
    flex: 1,
    marginTop: -20,
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: smallDevice ? 24 : 28,
    fontWeight: 'bold',
    marginBottom: 24,
    color: '#333333',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  ctaButton: {
    backgroundColor: '#ff0000',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 30,
    marginTop: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
  },
  ctaText: {
    color: '#ffffff',
    fontSize: smallDevice ? 16 : 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default AdvertCard;
