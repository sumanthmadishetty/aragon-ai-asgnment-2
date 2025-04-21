import axios from "axios";

// Define the base URL for the API
const API_BASE_URL = "http://localhost:5002/api";

// Create axios instance with base config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Types
export interface Image {
  id: string;
  originalName: string;
  s3Key: string;
  s3Url: string;
  mimeType: string;
  size: number;
  width: number;
  height: number;
  status: "UPLOADED" | "PROCESSING" | "VALIDATED" | "REJECTED";
  userId: string;
  batchId: string;
  hash?: string;
  uploadedAt: string;
  updatedAt: string;
  isDeleted: boolean;
  rejectionReason?: string;
  processingInfo?: {
    startedAt: string;
    completedAt?: string;
    processingTimeMs?: number;
  };
  faceInfo?: {
    hasFace: boolean;
    faceWidth?: number;
    faceHeight?: number;
    faceX?: number;
    faceY?: number;
    multipleFaces?: boolean;
    faceCount?: number;
  };
  validationResults?: Array<{
    id: string;
    type: string;
    passed: boolean;
    details?: any;
    value?: number;
    createdAt: string;
  }>;
}

export interface ImageUploadResponse {
  message: string;
  image: Image;
}

export interface BatchUploadResponse {
  message: string;
  images: Image[];
  errors: Array<{ filename: string; error: string }>;
  batch: any;
}

export interface ImagesResponse {
  images: Image[];
  total: number;
  page: number;
  totalPages: number;
}

// Image API functions
export const imageApi = {
  // Upload a single image
  uploadImage: async (
    file: File,
    batchId: string,
    userId: string
  ): Promise<ImageUploadResponse> => {
    const formData = new FormData();
    formData.append("image", file);
    formData.append("batchId", batchId);
    formData.append("userId", userId);

    const response = await apiClient.post("/images", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  // Upload multiple images in a batch
  uploadImages: async (
    files: File[],
    batchId: string,
    userId: string
  ): Promise<BatchUploadResponse> => {
    const formData = new FormData();

    files.forEach((file) => {
      formData.append("images", file);
    });

    formData.append("batchId", batchId);
    formData.append("userId", userId);

    const response = await apiClient.post("/images/batch-upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  // Get all images with filters
  getImages: async (params: {
    userId?: string;
    batchId?: string;
    status?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  }): Promise<ImagesResponse> => {
    const response = await apiClient.get("/images", { params });
    return response.data;
  },

  // Get images by user ID
  getImagesByUserId: async (
    userId: string,
    params: {
      status?: string;
      page?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: "asc" | "desc";
    }
  ): Promise<ImagesResponse> => {
    const response = await apiClient.get(`/images/user/${userId}`, { params });
    return response.data;
  },

  // Get an image by ID
  getImageById: async (id: string): Promise<Image> => {
    const response = await apiClient.get(`/images/${id}`);
    return response.data;
  },

  // Soft delete an image
  softDeleteImage: async (
    id: string
  ): Promise<{ message: string; image: Image }> => {
    const response = await apiClient.patch(`/images/${id}/soft-delete`);
    return response.data;
  },

  // Restore a soft-deleted image
  restoreImage: async (
    id: string
  ): Promise<{ message: string; image: Image }> => {
    const response = await apiClient.patch(`/images/${id}/restore`);
    return response.data;
  },

  // Hard delete an image
  deleteImage: async (
    id: string
  ): Promise<{ message: string; image: Image }> => {
    const response = await apiClient.delete(`/images/${id}`);
    return response.data;
  },

  // Get deleted images (admin function)
  getDeletedImages: async (params: {
    userId?: string;
    batchId?: string;
    status?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  }): Promise<ImagesResponse> => {
    const response = await apiClient.get("/images/deleted", { params });
    return response.data;
  },
};

export default imageApi;
