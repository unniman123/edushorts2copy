import React from 'react';
import { View, StyleSheet } from 'react-native';
import SkeletonLoader from './SkeletonLoader';

export default function SkeletonSettings() {
  return (
    <View style={styles.container} accessible={false}>
      <View style={styles.headerPlaceholder}>
        <SkeletonLoader style={styles.headerTitle} />
      </View>

      <View style={styles.section}>
        <SkeletonLoader style={styles.sectionTitle} />
        <SkeletonLoader style={styles.row} />
        <SkeletonLoader style={styles.row} />
      </View>

      <View style={styles.section}>
        <SkeletonLoader style={styles.sectionTitle} />
        <SkeletonLoader style={styles.row} />
        <SkeletonLoader style={styles.rowShort} />
      </View>

      <View style={styles.section}>
        <SkeletonLoader style={styles.sectionTitle} />
        <SkeletonLoader style={styles.row} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  headerPlaceholder: { padding: 16 },
  headerTitle: { height: 22, width: '40%', borderRadius: 6 },
  section: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#eee' },
  sectionTitle: { height: 18, width: '30%', borderRadius: 6, marginBottom: 12 },
  row: { height: 16, width: '100%', borderRadius: 6, marginBottom: 12 },
  rowShort: { height: 16, width: '60%', borderRadius: 6, marginBottom: 12 },
});


