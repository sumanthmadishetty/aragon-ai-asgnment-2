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
export interface Batch {
  id: string;
  name: string;
  description?: string;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  userId: string;
  totalImages: number;
  processedImages: number;
  validatedImages: number;
  rejectedImages: number;
  createdAt: string;
  updatedAt: string;
}

export interface BatchCreateResponse {
  message: string;
  batch: Batch;
}

export interface BatchesResponse {
  batches: Batch[];
  total: number;
  page: number;
  totalPages: number;
}

// Batch API functions
export const batchApi = {
  // Create a new batch
  createBatch: async (data: {
    name: string;
    description?: string;
    userId: string;
  }): Promise<BatchCreateResponse> => {
    const response = await apiClient.post("/batches", data);
    return response.data;
  },

  // Get all batches with filtering
  getBatches: async (params: {
    userId?: string;
    status?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  }): Promise<BatchesResponse> => {
    const response = await apiClient.get("/batches", { params });
    return response.data;
  },

  // Get batches by user ID
  getBatchesByUserId: async (
    userId: string,
    params: {
      status?: string;
      page?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: "asc" | "desc";
    }
  ): Promise<BatchesResponse> => {
    const response = await apiClient.get(`/batches/user/${userId}`, { params });
    return response.data;
  },

  // Get a batch by ID
  getBatchById: async (id: string): Promise<Batch> => {
    const response = await apiClient.get(`/batches/${id}`);
    return response.data;
  },

  // Update a batch
  updateBatch: async (
    id: string,
    data: { name?: string; description?: string; status?: string }
  ): Promise<Batch> => {
    const response = await apiClient.put(`/batches/${id}`, data);
    return response.data;
  },

  // Delete a batch
  deleteBatch: async (
    id: string
  ): Promise<{ message: string; batch: Batch }> => {
    const response = await apiClient.delete(`/batches/${id}`);
    return response.data;
  },
};

export default batchApi;
