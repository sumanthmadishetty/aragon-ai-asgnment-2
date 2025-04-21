import { 
  PutObjectCommand, 
  GetObjectCommand, 
  DeleteObjectCommand 
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Client, bucketName } from '../config/s3';
import { v4 as uuidv4 } from 'uuid';

/**
 * Uploads a file to S3 bucket
 */
export async function uploadToS3(fileBuffer: Buffer, mimeType: string, originalFilename: string): Promise<{ key: string, url: string }> {
  // Generate a unique filename with original extension
  const extension = originalFilename.split('.').pop() || '';
  const key = `uploads/${uuidv4()}.${extension}`;

  // Upload the file to S3
  const uploadParams = {
    Bucket: bucketName,
    Key: key,
    Body: fileBuffer,
    ContentType: mimeType,
  };

  await s3Client.send(new PutObjectCommand(uploadParams));

  // Generate a presigned URL for retrieval (valid for 1 hour)
  const getCommand = new GetObjectCommand({
    Bucket: bucketName,
    Key: key,
  });
  
  const url = await getSignedUrl(s3Client, getCommand, { expiresIn: 3600 });
  
  return { key, url };
}

/**
 * Gets a file from S3 bucket
 */
export async function getFromS3(key: string): Promise<Buffer> {
  const getParams = {
    Bucket: bucketName,
    Key: key,
  };
  
  const response = await s3Client.send(new GetObjectCommand(getParams));
  
  // Convert readable stream to buffer
  const chunks: Uint8Array[] = [];
  
  if (response.Body) {
    // @ts-ignore - AWS SDK types don't fully match
    for await (const chunk of response.Body) {
      chunks.push(chunk);
    }
  }
  
  return Buffer.concat(chunks);
}

/**
 * Deletes a file from S3 bucket
 */
export async function deleteFromS3(key: string): Promise<void> {
  const deleteParams = {
    Bucket: bucketName,
    Key: key,
  };
  
  await s3Client.send(new DeleteObjectCommand(deleteParams));
}

/**
 * Generates a presigned URL for an existing S3 object
 */
export async function getPresignedUrl(key: string, expiresIn = 3600): Promise<string> {
  const getCommand = new GetObjectCommand({
    Bucket: bucketName,
    Key: key,
  });
  
  return getSignedUrl(s3Client, getCommand, { expiresIn });
}