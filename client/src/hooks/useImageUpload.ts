import { useState, useCallback } from 'react';
import { imageApi, Image } from '../api/imageApi';
import { useUser } from '../context/UserContext';

export interface UploadedImage {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  status: 'uploading' | 'processing' | 'processed' | 'rejected';
  progress: number;
  previewUrl: string | null;
  rejectionReason: string | null;
  serverImageId?: string; // ID of the image on the server
  serverImage?: Image;    // The full image data from the server
}

interface UseImageUploadResult {
  uploadedImages: UploadedImage[];
  uploadError: string | null;
  isUploading: boolean;
  uploadImage: (file: File, batchId: string) => Promise<UploadedImage | null>;
  uploadMultipleImages: (files: File[], batchId: string) => Promise<UploadedImage[]>;
  removeImage: (imageId: string) => void;
  softDeleteImage: (imageId: string) => Promise<boolean>;
  getImagesByBatch: (batchId: string) => Promise<Image[]>;
}

export const useImageUpload = (): UseImageUploadResult => {
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const { user } = useUser();

  // Function to create a local image object
  const createLocalImage = (file: File): UploadedImage => {
    const imageId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    return {
      id: imageId,
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      status: 'uploading',
      progress: 0,
      previewUrl: null,
      rejectionReason: null
    };
  };

  // Function to update an image's progress
  const updateImageProgress = useCallback((imageId: string, progress: number) => {
    setUploadedImages(prev => 
      prev.map(img => 
        img.id === imageId 
          ? { ...img, progress } 
          : img
      )
    );
  }, []);

  // Function to update an image's status
  const updateImageStatus = useCallback((
    imageId: string, 
    status: UploadedImage['status'], 
    rejectionReason: string | null = null,
    serverImageId?: string,
    serverImage?: Image
  ) => {
    setUploadedImages(prev => 
      prev.map(img => 
        img.id === imageId 
          ? { 
              ...img, 
              status, 
              rejectionReason,
              serverImageId,
              serverImage
            } 
          : img
      )
    );
  }, []);

  // Upload a single image
  const uploadImage = useCallback(async (file: File, batchId: string): Promise<UploadedImage | null> => {
    if (!user) {
      setUploadError('User not authenticated');
      return null;
    }

    setUploadError(null);
    setIsUploading(true);

    // Create local image
    const newImage = createLocalImage(file);
    setUploadedImages(prev => [...prev, newImage]);

    try {
      // Create a preview URL
      const previewUrl = URL.createObjectURL(file);
      setUploadedImages(prev => 
        prev.map(img => 
          img.id === newImage.id 
            ? { ...img, previewUrl } 
            : img
        )
      );

      // Mock upload progress
      for (let progress = 0; progress <= 90; progress += 10) {
        updateImageProgress(newImage.id, progress);
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Update to processing status
      updateImageStatus(newImage.id, 'processing');

      // Actually upload to the server
      const response = await imageApi.uploadImage(file, batchId, user.id);
      
      // Update progress to 100%
      updateImageProgress(newImage.id, 100);

      // Check server response for image status
      const serverImage = response.image;
      const isRejected = serverImage.status === 'REJECTED';
      
      if (isRejected) {
        updateImageStatus(
          newImage.id, 
          'rejected', 
          serverImage.rejectionReason || 'Failed server-side validation', 
          serverImage.id,
          serverImage
        );
      } else {
        updateImageStatus(
          newImage.id, 
          'processed',
          null,
          serverImage.id,
          serverImage
        );
      }

      return newImage;
    } catch (error) {
      console.error('Error uploading image:', error);
      
      // Update image status to rejected
      updateImageStatus(
        newImage.id, 
        'rejected', 
        error instanceof Error ? error.message : 'Failed to upload image'
      );
      
      if (error instanceof Error) {
        setUploadError(error.message);
      } else {
        setUploadError('Failed to upload image');
      }
      
      return newImage;
    } finally {
      setIsUploading(false);
    }
  }, [user, updateImageProgress, updateImageStatus]);

  // Upload multiple images using Promise.all for individual uploads
  const uploadMultipleImages = useCallback(async (files: File[], batchId: string): Promise<UploadedImage[]> => {
    if (!user) {
      setUploadError('User not authenticated');
      return [];
    }

    if (!files.length) {
      return [];
    }

    setUploadError(null);
    setIsUploading(true);

    try {
      // Create local images for tracking
      const newImages = files.map(file => createLocalImage(file));
      setUploadedImages(prev => [...prev, ...newImages]);

      // Create preview URLs
      newImages.forEach(image => {
        const previewUrl = URL.createObjectURL(image.file);
        setUploadedImages(prev => 
          prev.map(img => 
            img.id === image.id 
              ? { ...img, previewUrl } 
              : img
          )
        );
      });

      // Simulate upload progress for each image
      for (let progress = 0; progress <= 90; progress += 10) {
        newImages.forEach(image => {
          updateImageProgress(image.id, progress);
        });
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Update all to processing status
      newImages.forEach(image => {
        updateImageStatus(image.id, 'processing');
      });

      // Process each image upload individually and update status immediately
      const uploadPromises = files.map(async (file, index) => {
        const localImage = newImages[index];
        
        try {
          // Update progress to 100% for this specific image
          updateImageProgress(localImage.id, 100);
          
          // Upload the individual image
          const response = await imageApi.uploadImage(file, batchId, user.id);
          const serverImage = response.image;
          const isRejected = serverImage.status === 'REJECTED';
          
          // Immediately update this image's status based on server response
          if (isRejected) {
            updateImageStatus(
              localImage.id, 
              'rejected', 
              serverImage.rejectionReason || 'Failed server-side validation',
              serverImage.id,
              serverImage
            );
          } else {
            updateImageStatus(
              localImage.id, 
              'processed',
              null,
              serverImage.id,
              serverImage
            );
          }
          
          return { success: true, localImage };
        } catch (error) {
          // Immediately update this image's status to rejected
          const errorMessage = error instanceof Error ? error.message : 'Failed to upload image';
          
          updateImageStatus(
            localImage.id, 
            'rejected', 
            errorMessage
          );
          
          console.error(`Error uploading image ${localImage.name}:`, error);
          return { success: false, localImage, error };
        }
      });
      
      // Wait for all uploads to complete but status updates have already happened
      await Promise.all(uploadPromises);

      return newImages;
    } catch (error) {
      console.error('Error in uploadMultipleImages:', error);
      
      if (error instanceof Error) {
        setUploadError(error.message);
      } else {
        setUploadError('Failed to upload images');
      }
      
      return [];
    } finally {
      setIsUploading(false);
    }
  }, [user, updateImageProgress, updateImageStatus, createLocalImage]);

  // Remove an image (both locally and on the server if uploaded)
  const removeImage = useCallback((imageId: string) => {
    const image = uploadedImages.find(img => img.id === imageId);
    
    if (image?.serverImageId) {
      // If the image has a server ID, soft delete it on the server
      imageApi.softDeleteImage(image.serverImageId)
        .catch(error => {
          console.error('Error soft deleting image on server:', error);
        });
    }
    
    // Remove from local state
    setUploadedImages(prev => prev.filter(img => img.id !== imageId));
    
    // Revoke object URL to prevent memory leaks
    if (image?.previewUrl) {
      URL.revokeObjectURL(image.previewUrl);
    }
  }, [uploadedImages]);

  // Soft delete an image on the server
  const softDeleteImage = useCallback(async (imageId: string): Promise<boolean> => {
    const image = uploadedImages.find(img => img.id === imageId);
    
    if (!image?.serverImageId) {
      console.error('Cannot soft delete: no server image ID found');
      return false;
    }
    
    try {
      await imageApi.softDeleteImage(image.serverImageId);
      
      // Remove from local state
      setUploadedImages(prev => prev.filter(img => img.id !== imageId));
      
      // Revoke object URL to prevent memory leaks
      if (image.previewUrl) {
        URL.revokeObjectURL(image.previewUrl);
      }
      
      return true;
    } catch (error) {
      console.error('Error soft deleting image:', error);
      return false;
    }
  }, [uploadedImages]);

  // Get images by batch ID
  const getImagesByBatch = useCallback(async (batchId: string): Promise<Image[]> => {
    try {
      const response = await imageApi.getImages({ batchId });
      return response.images;
    } catch (error) {
      console.error('Error fetching images by batch:', error);
      return [];
    }
  }, []);

  return {
    uploadedImages,
    uploadError,
    isUploading,
    uploadImage,
    uploadMultipleImages,
    removeImage,
    softDeleteImage,
    getImagesByBatch
  };
};

export default useImageUpload;