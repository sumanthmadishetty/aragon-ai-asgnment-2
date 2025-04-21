import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import imghash from 'imghash';
import { calculateHashSimilarity } from './utils/validationUtils';

/**
 * Test script to demonstrate image processing capabilities
 * without needing database access
 */
async function testImageProcessing() {
  console.log('🖼️ Image Processing API Test');
  console.log('============================');

  // 1. Create a test image
  console.log('\n1. Creating test images...');

  // Create a simple test image (red square)
  const redSquare = await sharp({
    create: {
      width: 1000,
      height: 1000,
      channels: 3,
      background: { r: 255, g: 0, b: 0 }
    }
  }).jpeg().toBuffer();

  // Create a different image (blue square)
  const blueSquare = await sharp({
    create: {
      width: 1000,
      height: 1000,
      channels: 3,
      background: { r: 0, g: 0, b: 255 }
    }
  }).jpeg().toBuffer();

  // Save images for demonstration
  fs.writeFileSync(path.join(__dirname, '../test-red-square.jpg'), redSquare);
  fs.writeFileSync(path.join(__dirname, '../test-blue-square.jpg'), blueSquare);

  console.log('✓ Created test-red-square.jpg and test-blue-square.jpg');

  // 2. Calculate image hashes for similarity
  console.log('\n2. Calculating image hashes for similarity detection...');
  const hash1 = await imghash.hash(redSquare, 16);
  const hash2 = await imghash.hash(blueSquare, 16);
  
  const similarityDistance = calculateHashSimilarity(hash1, hash2);
  
  console.log(`✓ Red square hash: ${hash1}`);
  console.log(`✓ Blue square hash: ${hash2}`);
  console.log(`✓ Hamming distance (similarity): ${similarityDistance} (Higher = more different)`);
  
  // 3. Check image dimensions
  console.log('\n3. Checking image dimensions...');
  const redSquareMetadata = await sharp(redSquare).metadata();
  console.log(`✓ Red square dimensions: ${redSquareMetadata.width}x${redSquareMetadata.height}`);
  
  // 4. Summary
  console.log('\n4. Validation results:');
  console.log(`✓ Are images similar? ${similarityDistance < 3 ? 'Yes' : 'No'}`);
  
  console.log('\nTest completed successfully!');
  console.log('\nThis demonstrates the core functionality of the image processing API.');
  console.log('For the full application including PostgreSQL and S3, follow the setup instructions in the README.');
}

testImageProcessing().catch(console.error);