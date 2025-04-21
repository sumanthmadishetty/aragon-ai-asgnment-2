import { S3Client } from '@aws-sdk/client-s3';
import { RekognitionClient } from '@aws-sdk/client-rekognition';
import dotenv from 'dotenv';

dotenv.config();

// S3 Configuration
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

// Rekognition Configuration
const rekognitionClient = new RekognitionClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

// S3 bucket name
const bucketName = process.env.S3_BUCKET_NAME || '';

export { s3Client, rekognitionClient, bucketName };