# Image Processing API

A robust backend system for image upload and processing with AWS S3 storage and PostgreSQL.

## Features

- Upload, store, and process images with multiple validation rules
- Organize images into batches with user associations
- Store image metadata in PostgreSQL with Prisma ORM
- Store image files in Amazon S3
- Process images asynchronously
- Convert HEIC images to JPEG
- Detect duplicate images using perceptual hashing
- Detect blurry images using Laplacian variance
- Detect and validate faces using AWS Rekognition
- Track batch processing status and statistics

## Validation Rules

The system implements several image validation rules:

1. **Size and Resolution**: Rejects images that are too small in size or resolution
2. **Format**: Rejects images that are not in JPG, PNG, or HEIC format
3. **Duplicates**: Rejects images that are too similar to existing ones using perceptual hashing
4. **Blur Detection**: Rejects blurry images using Laplacian variance algorithm
5. **Face Size**: Rejects images if detected face is too small
6. **Multiple Faces**: Rejects images containing multiple faces

## API Endpoints

### Image Endpoints

- `POST /api/images` - Upload a new image to a batch
- `POST /api/images/batch-upload` - Upload multiple images to a batch
- `GET /api/images` - List all images with pagination and filtering
- `GET /api/images/user/:userId` - Get images by user ID
- `GET /api/images/:id` - Get details for a specific image
- `DELETE /api/images/:id` - Delete an image

### Batch Endpoints

- `POST /api/batches` - Create a new batch
- `GET /api/batches` - List all batches with pagination and filtering
- `GET /api/batches/user/:userId` - Get batches by user ID
- `GET /api/batches/:id` - Get details for a specific batch
- `GET /api/batches/:id/images` - Get all images in a batch
- `DELETE /api/batches/:id` - Delete a batch and all its images

## Data Model

### Batch

- Organizes a collection of images
- Associated with a specific user
- Tracks processing statistics:
  - Total images
  - Processed images
  - Valid/rejected/error counts
  - Processing status

### Image

- Stored in S3 with metadata in PostgreSQL
- Always belongs to a batch
- Associated with a user
- Contains processing information and validation results

## Setup Requirements

### Prerequisites

- Node.js (v16+)
- PostgreSQL
- AWS Account with S3 and Rekognition access

### Environment Variables

Create a `.env` file with the following variables:

```
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/image_processor"

# AWS S3
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key
S3_BUCKET_NAME=your-image-bucket

# App Config
PORT=5002
NODE_ENV=development
MAX_FILE_SIZE=10485760 # 10MB
MIN_IMAGE_WIDTH=800
MIN_IMAGE_HEIGHT=600
ALLOWED_MIME_TYPES=image/jpeg,image/png,image/heic
BLUR_THRESHOLD=100 # Laplacian variance threshold
MIN_FACE_AREA_PERCENT=5.0 # Minimum face area percentage
```

## Setup Instructions

1. Install dependencies:
   ```
   npm install
   ```

2. Generate Prisma client:
   ```
   npm run db:generate
   ```

3. Create the PostgreSQL database:
   ```
   # Create the database (replace with your PostgreSQL credentials if different)
   createdb image_processor
   
   # Or using psql
   psql -U postgres -c "CREATE DATABASE image_processor;"
   ```

4. Initialize the database schema:
   ```
   npm run db:migrate
   ```

4. Seed the database (optional):
   ```
   npm run db:seed
   ```

5. Start the development server:
   ```
   npm run dev
   ```

6. For production:
   ```
   npm run build:prod
   npm start
   ```

## API Usage Examples

### Create a Batch

```bash
curl -X POST http://localhost:5002/api/batches \
  -H "Content-Type: application/json" \
  -d '{"name": "Vacation Photos", "userId": "user123", "description": "Summer vacation photos"}'
```

### Upload an Image to a Batch

```bash
curl -X POST http://localhost:5002/api/images \
  -F "image=@/path/to/image.jpg" \
  -F "batchId=batch123" \
  -F "userId=user123"
```

### Upload Multiple Images to a Batch

```bash
curl -X POST http://localhost:5002/api/images/batch-upload \
  -F "images=@/path/to/image1.jpg" \
  -F "images=@/path/to/image2.jpg" \
  -F "images=@/path/to/image3.jpg" \
  -F "batchId=batch123" \
  -F "userId=user123"
```

## Technologies Used

- **TypeScript** - Strongly typed language
- **Express** - Web framework
- **Prisma** - ORM for database interactions
- **PostgreSQL** - Database for metadata storage
- **AWS S3** - Cloud storage for images
- **AWS Rekognition** - Face detection
- **Sharp** - Image processing library
- **Multer** - Handling file uploads
- **HEIC-Convert** - Converting HEIC images
- **Jimp** - Image manipulation for blur detection
- **imgHash** - Perceptual hashing for similarity detection