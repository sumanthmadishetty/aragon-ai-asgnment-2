interface ValidationResult {
  isValid: boolean;
  reason: string | null;
}

// Client-side image validation
export const validateImage = (file: File): ValidationResult => {
  // Check file type (both mime type and extension)
  const validMimeTypes = ["image/jpeg", "image/png", "image/heic"];
  const validExtensions = [".jpg", ".jpeg", ".png", ".heic"];

  const fileExtension = file.name
    .substring(file.name.lastIndexOf("."))
    .toLowerCase();
  const isValidType =
    validMimeTypes.includes(file.type) ||
    validExtensions.some((ext) => file.name.toLowerCase().endsWith(ext));

  if (!isValidType) {
    return {
      isValid: false,
      reason:
        "Invalid file format. Please upload JPG, PNG, or HEIC files only.",
    };
  }

  // Check file size (max 120MB)
  const maxSize = 120 * 1024 * 1024; // 120MB in bytes
  if (file.size > maxSize) {
    return {
      isValid: false,
      reason: `File exceeds 120MB size limit. Your file is ${(
        file.size /
        (1024 * 1024)
      ).toFixed(2)}MB.`,
    };
  }

  // For demo purposes, randomly simulate server-side validation failures
  // In a real app, these would be actual image processing validations

  // If all checks pass
  return {
    isValid: true,
    reason: null,
  };
};

// Function to extract dimensions from an image file
export const getImageDimensions = (
  file: File
): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({
        width: img.width,
        height: img.height,
      });
    };
    img.onerror = () => {
      reject(new Error("Failed to load image for dimension analysis"));
    };
    img.src = URL.createObjectURL(file);
  });
};

// Function to check if an image has sufficient resolution
export const hasMinimumResolution = async (
  file: File,
  minWidth = 800,
  minHeight = 800
): Promise<ValidationResult> => {
  try {
    const dimensions = await getImageDimensions(file);

    if (dimensions.width < minWidth || dimensions.height < minHeight) {
      return {
        isValid: false,
        reason: `Image resolution too low. Minimum ${minWidth}x${minHeight} required, but image is ${dimensions.width}x${dimensions.height}.`,
      };
    }

    return {
      isValid: true,
      reason: null,
    };
  } catch (error) {
    console.error("Error checking image resolution:", error);
    return {
      isValid: false,
      reason: "Failed to verify image resolution.",
    };
  }
};
