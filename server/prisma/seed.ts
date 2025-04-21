import { PrismaClient, ImageStatus, BatchStatus } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed script...');

  // Clean up any existing data
  await prisma.faceInfo.deleteMany({});
  await prisma.processingInfo.deleteMany({});
  await prisma.image.deleteMany({});
  await prisma.batch.deleteMany({});
  
  console.log('Database cleaned.');

  // Create sample users (in a real app, these would be in a users table)
  const users = [
    { id: 'user1', name: 'John Doe' },
    { id: 'user2', name: 'Jane Smith' }
  ];

  // Create sample batches
  const batches = [
    {
      id: uuidv4(),
      name: 'Vacation Photos',
      description: 'Photos from summer vacation',
      userId: users[0].id,
      status: BatchStatus.COMPLETED
    },
    {
      id: uuidv4(),
      name: 'Profile Pictures',
      description: 'Potential profile pictures',
      userId: users[0].id,
      status: BatchStatus.PROCESSING
    },
    {
      id: uuidv4(),
      name: 'Work Event',
      description: 'Photos from company event',
      userId: users[1].id,
      status: BatchStatus.COMPLETED
    }
  ];

  // Insert batches
  const createdBatches = [];
  for (const batch of batches) {
    const createdBatch = await prisma.batch.create({
      data: batch
    });
    createdBatches.push(createdBatch);
    console.log(`Created batch: ${createdBatch.id} (${createdBatch.name})`);
  }

  // Create some sample images
  const images = [
    {
      id: uuidv4(),
      originalName: 'sample1.jpg',
      s3Key: 'uploads/sample1.jpg',
      s3Url: 'https://example.com/sample1.jpg',
      mimeType: 'image/jpeg',
      size: 1024 * 1024 * 2, // 2MB
      width: 1920,
      height: 1080,
      status: ImageStatus.VALIDATED,
      userId: users[0].id,
      batchId: createdBatches[0].id,
      hash: 'f8e966d1e207d02c44719e7',
      blurScore: 152.5,
      tags: ['sample', 'test']
    },
    {
      id: uuidv4(),
      originalName: 'sample2.jpg',
      s3Key: 'uploads/sample2.jpg',
      s3Url: 'https://example.com/sample2.jpg',
      mimeType: 'image/jpeg',
      size: 1024 * 1024 * 1.5, // 1.5MB
      width: 1280,
      height: 720,
      status: ImageStatus.VALIDATED,
      userId: users[0].id,
      batchId: createdBatches[0].id,
      hash: 'a1b2c3d4e5f6g7h8i9j0k',
      blurScore: 180.2,
      tags: ['sample', 'test']
    },
    {
      id: uuidv4(),
      originalName: 'blurry_image.jpg',
      s3Key: 'uploads/blurry_image.jpg',
      s3Url: 'https://example.com/blurry_image.jpg',
      mimeType: 'image/jpeg',
      size: 1024 * 1024, // 1MB
      width: 1024,
      height: 768,
      status: ImageStatus.REJECTED,
      userId: users[0].id,
      batchId: createdBatches[1].id,
      hash: 'x7y8z9a1b2c3d4e5f6g7',
      blurScore: 45.7,
      tags: ['blurry', 'rejected']
    },
    {
      id: uuidv4(),
      originalName: 'multi_face.jpg',
      s3Key: 'uploads/multi_face.jpg',
      s3Url: 'https://example.com/multi_face.jpg',
      mimeType: 'image/jpeg',
      size: 1024 * 1024 * 3, // 3MB
      width: 2048,
      height: 1536,
      status: ImageStatus.REJECTED,
      userId: users[1].id,
      batchId: createdBatches[2].id,
      hash: 'h9i8j7k6l5m4n3o2p1q0',
      blurScore: 205.3,
      tags: ['multiple-faces', 'rejected']
    },
    {
      id: uuidv4(),
      originalName: 'processing.png',
      s3Key: 'uploads/processing.png',
      s3Url: 'https://example.com/processing.png',
      mimeType: 'image/png',
      size: 1024 * 1024 * 2.5, // 2.5MB
      width: 1600,
      height: 900,
      status: ImageStatus.PROCESSING,
      userId: users[0].id,
      batchId: createdBatches[1].id,
      tags: ['processing']
    }
  ];

  // Insert images
  for (const image of images) {
    const createdImage = await prisma.image.create({
      data: image
    });

    console.log(`Created image: ${createdImage.id} (${createdImage.originalName})`);

    // Add processing info for each image
    await prisma.processingInfo.create({
      data: {
        imageId: createdImage.id,
        startedAt: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
        completedAt: createdImage.status !== ImageStatus.PROCESSING ? new Date() : null,
        processingTimeMs: createdImage.status !== ImageStatus.PROCESSING ? Math.floor(Math.random() * 5000) + 1000 : null,
        error: createdImage.status === ImageStatus.ERROR ? 'Error processing image' : null
      }
    });

    // Add face info for each image
    if (createdImage.originalName === 'multi_face.jpg') {
      await prisma.faceInfo.create({
        data: {
          imageId: createdImage.id,
          faceCount: 3,
          primaryFaceArea: 15.5,
          confidence: 98.7,
          boundingBox: { 
            Width: 0.4, 
            Height: 0.3, 
            Left: 0.2, 
            Top: 0.1 
          }
        }
      });
    } else if (createdImage.status === ImageStatus.VALIDATED) {
      await prisma.faceInfo.create({
        data: {
          imageId: createdImage.id,
          faceCount: 1,
          primaryFaceArea: 25.8,
          confidence: 99.5,
          boundingBox: { 
            Width: 0.5, 
            Height: 0.6, 
            Left: 0.25, 
            Top: 0.2 
          }
        }
      });
    } else if (createdImage.originalName === 'blurry_image.jpg') {
      await prisma.faceInfo.create({
        data: {
          imageId: createdImage.id,
          faceCount: 1,
          primaryFaceArea: 4.2,  // Too small face
          confidence: 92.1,
          boundingBox: { 
            Width: 0.2, 
            Height: 0.21, 
            Left: 0.4, 
            Top: 0.3 
          }
        }
      });
    }
  }

  // Update batch statistics
  for (const batch of createdBatches) {
    const batchImages = await prisma.image.findMany({
      where: { batchId: batch.id }
    });
    
    const totalImages = batchImages.length;
    const validImages = batchImages.filter(img => img.status === ImageStatus.VALIDATED).length;
    const rejectedImages = batchImages.filter(img => img.status === ImageStatus.REJECTED).length;
    const errorImages = batchImages.filter(img => img.status === ImageStatus.ERROR).length;
    const processingImages = batchImages.filter(img => img.status === ImageStatus.PROCESSING).length;
    const processedImages = totalImages - processingImages;
    
    await prisma.batch.update({
      where: { id: batch.id },
      data: {
        totalImages,
        validImages,
        rejectedImages,
        errorImages,
        processedImages,
        completedAt: batch.status === BatchStatus.COMPLETED ? new Date() : null
      }
    });
    
    console.log(`Updated batch statistics for: ${batch.id} (${batch.name})`);
  }

  console.log('Seed completed successfully.');
}

main()
  .catch((e) => {
    console.error('Error in seed script:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });