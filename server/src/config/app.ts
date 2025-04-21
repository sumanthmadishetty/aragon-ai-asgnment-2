import dotenv from "dotenv";

dotenv.config();

// App configuration
const config = {
  port: parseInt(process.env.PORT || "5000", 10),
  nodeEnv: process.env.NODE_ENV || "development",

  // Image upload configuration
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE || "10485760", 10), // 10MB default
  minImageWidth: parseInt(process.env.MIN_IMAGE_WIDTH || "250", 10),
  minImageHeight: parseInt(process.env.MIN_IMAGE_HEIGHT || "250", 10),
  allowedMimeTypes: (
    process.env.ALLOWED_MIME_TYPES || "image/jpeg,image/png,image/heic"
  ).split(","),

  // Image validation configuration
  blurThreshold: parseInt(process.env.BLUR_THRESHOLD || "10", 10),
  minFaceAreaPercent: parseFloat(process.env.MIN_FACE_AREA_PERCENT || "4.0"),

  // Production settings
  isProduction: process.env.NODE_ENV === "production",
};

export default config;
