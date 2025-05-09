class PerformanceMonitoringService {
  private static instance: PerformanceMonitoringService;

  public static getInstance(): PerformanceMonitoringService {
    if (!PerformanceMonitoringService.instance) {
      PerformanceMonitoringService.instance = new PerformanceMonitoringService();
    }
    return PerformanceMonitoringService.instance;
  }

  recordRenderStart = jest.fn();
  recordRenderComplete = jest.fn();
  recordRenderTime = jest.fn();
  recordImageLoad = jest.fn();
  recordApiCall = jest.fn();
  recordEvent = jest.fn();
  getMetrics = jest.fn().mockReturnValue({});
  resetMetrics = jest.fn();
}

export default PerformanceMonitoringService; 