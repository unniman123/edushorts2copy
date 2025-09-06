import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ImageSourcePropType, Image, Animated, Easing } from 'react-native';
// Use expo-image when available for native performance
let ExpoImage: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const mod = require('expo-image');
  ExpoImage = mod.Image || mod.default || mod;
} catch (e) {
  ExpoImage = null;
}
import SkeletonLoader from './SkeletonLoader';

interface AppImageProps {
  source: { uri: string } | number | ImageSourcePropType;
  style?: any;
  resizeMethod?: 'auto' | 'resize' | 'scale';
  progressiveRenderingEnabled?: boolean;
  onLoad?: () => void;
  onLoadStart?: () => void;
  onError?: () => void;
  placeholder?: React.ReactNode;
}

const AppImage: React.FC<AppImageProps> = ({
  source,
  style,
  resizeMethod = 'resize',
  progressiveRenderingEnabled = true,
  onLoad,
  onLoadStart,
  onError,
  placeholder,
}) => {
  const [loaded, setLoaded] = useState(false);
  const opacity = useRef(new Animated.Value(0)).current;
  const AnimatedImage = Animated.createAnimatedComponent(Image);

  const handleLoad = () => {
    // Fade-in animation to reduce layout jank
    Animated.timing(opacity, {
      toValue: 1,
      duration: 250,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
    setLoaded(true);
    if (onLoad) onLoad();
  };

  const handleError = () => {
    setLoaded(true);
    if (onError) onError();
  };

  return (
    <View style={[styles.container, style]}>
      {ExpoImage ? (
        <ExpoImage
          source={source as any}
          style={[styles.image, { opacity: opacity }, style]}
          contentFit="cover"
          cachePolicy="disk"
          onLoad={handleLoad}
          onError={handleError}
          transition={250}
        />
      ) : (
        <AnimatedImage
          source={source as any}
          style={[styles.image, { opacity: opacity }, style]}
          resizeMethod={resizeMethod}
          progressiveRenderingEnabled={progressiveRenderingEnabled}
          onLoad={handleLoad}
          onError={handleError}
        />
      )}

      {!loaded && (
        placeholder ? (
          <View style={StyleSheet.absoluteFillObject}>{placeholder}</View>
        ) : (
          <SkeletonLoader style={styles.skeleton} />
        )
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    width: '100%',
    height: '100%',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  skeleton: {
    ...StyleSheet.absoluteFillObject,
  },
});

export default AppImage;


