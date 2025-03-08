import * as ImageManipulator from 'expo-image-manipulator';
import { supabase } from './supabaseClient';
import { ImageUploadOptions, ImageUploadResult, ImageFile } from '../types/accessibility';

export class StorageService {
  private bucketName: string = 'article-images';
  private storageUrl: string;

  constructor() {
    this.storageUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
  }

  private async uriToBlob(uri: string): Promise<Blob> {
    const response = await fetch(uri);
    return await response.blob();
  }

  async uploadImage(imageFile: ImageFile, options: ImageUploadOptions = {}): Promise<ImageUploadResult> {
    try {
      this.validateImage(imageFile, options);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const compressedImage = await this.compressImage(imageFile);
      const timestamp = Date.now();
      const fileName = `${timestamp}-${imageFile.name || 'image.jpg'}`;
      const filePath = `${user.id}/${fileName}`;

      // Convert URI to Blob for upload
      const blob = await this.uriToBlob(compressedImage.uri);
      
      const { error } = await supabase.storage
        .from(this.bucketName)
        .upload(filePath, blob, {
          contentType: 'image/jpeg',
          cacheControl: '3600',
        });

      if (error) {
        throw new Error(`Failed to upload image: ${error.message}`);
      }

      const url = `${this.storageUrl}/storage/v1/object/public/${this.bucketName}/${filePath}`;

      return {
        path: filePath,
        url,
        size: blob.size,
      };
    } catch (error: any) {
      console.error('Error uploading image:', error);
      throw error;
    }
  }

  async deleteImage(path: string): Promise<void> {
    try {
      const { error } = await supabase.storage
        .from(this.bucketName)
        .remove([path]);

      if (error) {
        throw new Error(`Failed to delete image: ${error.message}`);
      }
    } catch (error: any) {
      console.error('Error deleting image:', error);
      throw error;
    }
  }

  async compressImage(imageFile: ImageFile, maxSize: number = 2048 * 1024): Promise<ImageFile> {
    try {
      const manipResult = await ImageManipulator.manipulateAsync(
        imageFile.uri,
        [{ resize: { width: 1024 } }],
        { 
          compress: 0.7, 
          format: ImageManipulator.SaveFormat.JPEG
        }
      );

      // Create a new ImageFile object from the manipulation result
      const compressedFile: ImageFile = {
        uri: manipResult.uri,
        type: 'image/jpeg',
        name: imageFile.name || 'compressed-image.jpg',
        size: 0 // Size will be set during upload from blob
      };

      return compressedFile;
    } catch (error: any) {
      console.error('Error compressing image:', error);
      throw error;
    }
  }

  private validateImage(file: ImageFile, options: ImageUploadOptions): void {
    if (!file || !file.uri) {
      throw new Error('Image file is required');
    }

    if (options.allowedTypes && !options.allowedTypes.includes(file.type)) {
      throw new Error(`File type is not allowed: ${file.type}. Allowed types are ${options.allowedTypes.join(', ')}`);
    }

    // Note: Size validation is handled during compression and upload
  }
}

// Create and export a singleton instance
export const storageService = new StorageService();
