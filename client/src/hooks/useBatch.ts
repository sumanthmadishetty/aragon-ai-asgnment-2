import { useState, useCallback } from "react";
import { batchApi, Batch } from "../api/batchApi";
import { useUser } from "../context/UserContext";

interface UseBatchResult {
  batch: Batch | null;
  batchError: string | null;
  batchLoading: boolean;
  createNewBatch: (name: string, description?: string) => Promise<Batch | null>;
  getBatch: (batchId: string) => Promise<Batch | null>;
}

export const useBatch = (): UseBatchResult => {
  const [batch, setBatch] = useState<Batch | null>(null);
  const [batchError, setBatchError] = useState<string | null>(null);
  const [batchLoading, setBatchLoading] = useState<boolean>(false);
  const { user } = useUser();

  // Create a new batch for the current user
  const createNewBatch = useCallback(
    async (name: string, description?: string): Promise<Batch | null> => {
      console.log("Creating new batch:", name, description, user);
      if (!user) {
        setBatchError("User not authenticated");
        console.error("User not authenticated");
      }

      setBatchLoading(true);
      setBatchError(null);

      try {
        const response = await batchApi.createBatch({
          name,
          description,
          userId: user?.id || "12323423",
        });

        const newBatch = response.batch;
        setBatch(newBatch);
        return newBatch;
      } catch (error) {
        console.error("Error creating batch:", error);
        if (error instanceof Error) {
          setBatchError(error.message);
        } else {
          setBatchError("Failed to create batch");
        }
        return null;
      } finally {
        setBatchLoading(false);
      }
    },
    [user]
  );

  // Get a batch by ID
  const getBatch = useCallback(
    async (batchId: string): Promise<Batch | null> => {
      setBatchLoading(true);
      setBatchError(null);

      try {
        const fetchedBatch = await batchApi.getBatchById(batchId);
        setBatch(fetchedBatch);
        return fetchedBatch;
      } catch (error) {
        console.error("Error fetching batch:", error);
        if (error instanceof Error) {
          setBatchError(error.message);
        } else {
          setBatchError("Failed to fetch batch");
        }
        return null;
      } finally {
        setBatchLoading(false);
      }
    },
    []
  );

  return {
    batch,
    batchError,
    batchLoading,
    createNewBatch,
    getBatch,
  };
};

export default useBatch;
