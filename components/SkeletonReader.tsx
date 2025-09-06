import React from 'react';
import { View, StyleSheet } from 'react-native';
import SkeletonLoader from './SkeletonLoader';

export default function SkeletonReader() {
  return (
    <View style={styles.container} accessible={false}>
      <View style={styles.inner}>
        <SkeletonLoader style={styles.title} />
        <SkeletonLoader style={styles.subtitle} />
        <SkeletonLoader style={[styles.line, { width: '96%' }]} />
        <SkeletonLoader style={[styles.line, { width: '94%' }]} />
        <SkeletonLoader style={[styles.line, { width: '92%' }]} />
        <SkeletonLoader style={[styles.line, { width: '90%' }]} />
        <SkeletonLoader style={[styles.line, { width: '88%' }]} />
        <SkeletonLoader style={[styles.line, { width: '86%' }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  inner: { padding: 16 },
  title: { height: 22, width: '70%', borderRadius: 6, marginBottom: 8 },
  subtitle: { height: 14, width: '40%', borderRadius: 6, marginBottom: 12 },
  line: { height: 14, borderRadius: 6, marginBottom: 10 },
});


