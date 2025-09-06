import React from 'react';
import { View, StyleSheet } from 'react-native';
import SkeletonLoader from './SkeletonLoader';

export default function SkeletonBookmarkItem() {
  return (
    <View style={styles.container} accessible={false}>
      <SkeletonLoader style={styles.image} />
      <View style={styles.content}>
        <SkeletonLoader style={styles.title} />
        <SkeletonLoader style={styles.meta} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    padding: 0,
  },
  image: {
    width: 100,
    height: 100,
  },
  content: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
  },
  title: {
    height: 16,
    width: '80%',
    borderRadius: 6,
    marginBottom: 8,
  },
  meta: {
    height: 12,
    width: '40%',
    borderRadius: 6,
  },
});


