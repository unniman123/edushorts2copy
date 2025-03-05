import React, { useEffect } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

interface SkeletonLoaderProps {
  width?: number | string;
  height?: number;
  style?: any;
}

export default function SkeletonLoader({ width = '100%', height = 150, style }: SkeletonLoaderProps) {
  const animatedValue = new Animated.Value(0);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: false,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, []);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          width,
          height,
          opacity,
        },
        style,
      ]}
    >
      <View style={styles.content}>
        <View style={styles.imageContainer} />
        <View style={styles.textContainer}>
          <View style={styles.titleBar} />
          <View style={styles.contentBar} />
          <View style={styles.contentBar} />
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#E1E9EE',
    borderRadius: 12,
    overflow: 'hidden',
    marginVertical: 8,
  },
  content: {
    flexDirection: 'row',
    padding: 12,
  },
  imageContainer: {
    width: 100,
    height: 100,
    backgroundColor: '#F2F8FC',
    borderRadius: 8,
  },
  textContainer: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  titleBar: {
    width: '80%',
    height: 20,
    backgroundColor: '#F2F8FC',
    borderRadius: 4,
    marginBottom: 12,
  },
  contentBar: {
    width: '100%',
    height: 16,
    backgroundColor: '#F2F8FC',
    borderRadius: 4,
    marginBottom: 8,
  },
});
