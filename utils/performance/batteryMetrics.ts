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

 