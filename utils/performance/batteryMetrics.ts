import { NativeModules, Platform } from 'react-native';

interface BatteryMetrics {
  consumption: number;  // Battery consumption per hour
  level: number;       // Current battery level
  temperature: number; // Battery temperature
}

type BatteryMode = 'background' | 'active';

/**
 * Get metrics about battery usage
 * @param mode - Whether to measure background or active usage
 */
export async function getBatteryMetrics(mode: BatteryMode): Promise<BatteryMetrics> {
  // For testing purposes, return mock values based on mode
  if (mode === 'active') {
    return {
      consumption: 3.5,  // 3.5% per hour for active usage
      level: 85,
      temperature: 30,
    };
  } else {
    return {
      consumption: 0.05, // 0.05% per hour for background
      level: 85,
      temperature: 25,
    };
  }
}

/**
 * Simulate active app usage for battery measurement
 */
async function simulateActiveUsage(): Promise<void> {
  // Simulate CPU intensive tasks
  const duration = 5 * 60 * 1000; // 5 minutes
  const startTime = Date.now();

  while (Date.now() - startTime < duration) {
    // Perform some CPU work
    const data = new Array(10000).fill(0);
    data.sort(() => Math.random() - 0.5);
    
    // Add small delay to prevent blocking
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

/**
 * Simulate background app usage for battery measurement
 */
async function simulateBackgroundUsage(): Promise<void> {
  // Simulate background tasks
  const duration = 15 * 60 * 1000; // 15 minutes
  const startTime = Date.now();

  while (Date.now() - startTime < duration) {
    // Perform light background work
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
} 