import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import SkeletonLoader from './SkeletonLoader';

const { width, height } = Dimensions.get('window');

export default function SkeletonNewsCard() {
  return (
    <View style={styles.container} accessible={false}>
      {/* Image placeholder */}
      <SkeletonLoader style={styles.image} />

      <View style={styles.content}>
        {/* Title */}
        <SkeletonLoader style={styles.titleLarge} />
        <SkeletonLoader style={styles.titleSmall} />

        {/* Summary lines */}
        <SkeletonLoader style={[styles.line, { width: '92%' }]} />
        <SkeletonLoader style={[styles.line, { width: '88%' }]} />
        <SkeletonLoader style={[styles.line, { width: '84%' }]} />
        <SkeletonLoader style={[styles.line, { width: '92%' }]} />
        <SkeletonLoader style={[styles.line, { width: '80%' }]} />
        <SkeletonLoader style={[styles.line, { width: '60%' }]} />

        <View style={styles.footerRow}>
          <SkeletonLoader style={styles.meta} />
          <View style={styles.actions}>
            <SkeletonLoader style={styles.icon} />
            <SkeletonLoader style={styles.icon} />
            <SkeletonLoader style={styles.icon} />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  image: {
    width: '100%',
    height: Math.round(height * 0.45),
    backgroundColor: '#e6e6e6',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  titleLarge: {
    height: 20,
    width: '72%',
    marginTop: 8,
    borderRadius: 4,
  },
  titleSmall: {
    height: 18,
    width: '50%',
    marginTop: 8,
    borderRadius: 4,
  },
  line: {
    height: 14,
    marginTop: 8,
    borderRadius: 4,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  meta: {
    height: 14,
    width: '30%',
    borderRadius: 4,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    height: 36,
    width: 36,
    borderRadius: 18,
    marginLeft: 12,
  },
});


