import { StorageService } from '../storage';
import { ImageFile } from '../../types/accessibility';
import * as ImageManipulator from 'expo-image-manipulator';

// Mock expo-image-manipulator
jest.mock('expo-image-manipulator', () => ({
  manipulateAsync: jest.fn(),
  SaveFormat: {
    JPEG: 'jpeg'
  }
}));

// Mock supabase client
jest.mock('../supabaseClient', () => ({
  supabase: {
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'test-user-id' } } })
    },
    storage: {
      from: jest.fn().mockReturnValue({
        upload: jest.fn().mockResolvedValue({ data: { path: 'test-path' }, error: null }),
        remove: jest.fn().mockResolvedValue({ error: null })
      })
    }
  }
}));

describe('StorageService', () => {
  let storageService: StorageService;
  let mockImageFile: ImageFile;

  beforeEach(() => {
    storageService = new StorageService();
    mockImageFile = {
      uri: 'file://test.jpg',
      type: 'image/jpeg',
      name: 'test.jpg',
      size: 1024
    };

    // Reset all mocks
    jest.clearAllMocks();

    // Mock fetch for uriToBlob
    global.fetch = jest.fn().mockResolvedValue({
      blob: jest.fn().mockResolvedValue(new Blob(['test'], { type: 'image/jpeg' }))
    });

    // Mock ImageManipulator
    (ImageManipulator.manipulateAsync as jest.Mock).mockResolvedValue({
      uri: 'compressed-file://test.jpg',
      width: 800,
      height: 600
    });
  });

  describe('uploadImage', () => {
    it('should successfully upload an image', async () => {
      const result = await storageService.uploadImage(mockImageFile);
      
      expect(result).toHaveProperty('path');
      expect(result).toHaveProperty('url');
      expect(result).toHaveProperty('size');
      expect(result.path).toContain('test-user-id');
    });

    it('should throw error if not authenticated', async () => {
      const { supabase } = require('../supabaseClient');
      supabase.auth.getUser.mockResolvedValueOnce({ data: { user: null } });

      await expect(storageService.uploadImage(mockImageFile))
        .rejects
        .toThrow('Not authenticated');
    });

    it('should validate file type', async () => {
      const invalidFile = { ...mockImageFile, type: 'invalid/type' };
      
      await expect(storageService.uploadImage(invalidFile, {
        allowedTypes: ['image/jpeg', 'image/png']
      }))
        .rejects
        .toThrow('File type is not allowed');
    });
  });

  describe('compressImage', () => {
    it('should compress image successfully', async () => {
      const result = await storageService.compressImage(mockImageFile);
      
      expect(ImageManipulator.manipulateAsync).toHaveBeenCalledWith(
        mockImageFile.uri,
        [{ resize: { width: 1024 } }],
        expect.any(Object)
      );
      expect(result.uri).toBe('compressed-file://test.jpg');
    });
  });

  describe('deleteImage', () => {
    it('should delete image successfully', async () => {
      await storageService.deleteImage('test-path');
      
      const { supabase } = require('../supabaseClient');
      expect(supabase.storage.from().remove)
        .toHaveBeenCalledWith(['test-path']);
    });
  });
});
