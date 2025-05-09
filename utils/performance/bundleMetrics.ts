import { Platform } from 'react-native';

interface BundleMetrics {
  size: number;             // Total bundle size in bytes
  initialBundleSize: number; // Initial bundle size for first load
  totalSize: number;        // Total size including split bundles
  loadTime: number;         // Time to load the bundle in ms
}

/**
 * Get metrics about the JavaScript bundle
 */
export async function getBundleMetrics(): Promise<BundleMetrics> {
  // Return mock data for testing
  return {
    size: 2.5 * 1024 * 1024,          // 2.5MB total bundle
    initialBundleSize: 1.2 * 1024 * 1024, // 1.2MB initial bundle
    totalSize: 4 * 1024 * 1024,       // 4MB total including split bundles
    loadTime: 350,                    // 350ms load time
  };
} 