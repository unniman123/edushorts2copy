import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import SkeletonLoader from './SkeletonLoader';

const { height } = Dimensions.get('window');

export default function SkeletonArticleDetail() {
  return (
    <View style={styles.container} accessible={false}>
      <SkeletonLoader style={styles.image} />
      <View style={styles.content}>
        <SkeletonLoader style={styles.title} />
        <SkeletonLoader style={styles.meta} />

        <View style={styles.body}>
          <SkeletonLoader style={[styles.line, { width: '96%' }]} />
          <SkeletonLoader style={[styles.line, { width: '92%' }]} />
          <SkeletonLoader style={[styles.line, { width: '94%' }]} />
          <SkeletonLoader style={[styles.line, { width: '88%' }]} />
          <SkeletonLoader style={[styles.line, { width: '80%' }]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  image: { width: '100%', height: Math.round(height * 0.35), backgroundColor: '#e6e6e6' },
  content: { paddingHorizontal: 16, paddingTop: 12 },
  title: { height: 22, width: '70%', borderRadius: 6, marginBottom: 8 },
  meta: { height: 12, width: '40%', borderRadius: 6, marginBottom: 16 },
  body: { marginTop: 8 },
  line: { height: 14, borderRadius: 6, marginBottom: 10 },
});


