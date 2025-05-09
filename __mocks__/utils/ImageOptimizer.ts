class ImageOptimizer {
  private static instance: ImageOptimizer;
  
  public static getInstance(): ImageOptimizer {
    if (!ImageOptimizer.instance) {
      ImageOptimizer.instance = new ImageOptimizer();
    }
    return ImageOptimizer.instance;
  }
  
  preloadImage = jest.fn().mockResolvedValue(undefined);
  getOptimizedImageUri = jest.fn().mockImplementation((uri) => uri);
  clearCache = jest.fn();
}

export default ImageOptimizer; 