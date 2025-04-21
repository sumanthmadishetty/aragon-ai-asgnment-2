# Aragon AI Assignment 2

A production-ready full-stack application with a React/TypeScript client and Express/TypeScript server that handles image upload, validation, and storage.

## Features

### Frontend
- Image upload with drag and drop functionality
- Client-side validation for file formats and size
- Real-time upload progress tracking
- Categorized display of accepted and rejected images
- Responsive design that works on mobile and desktop

### Backend
- RESTful API built with Express.js
- TypeScript for type safety and improved development experience
- PostgreSQL database for image metadata storage
- AWS S3 integration for image storage
- Prisma ORM for database operations
- Validation checks for images:
  - Size and resolution validation
  - Format validation (PNG, JPG, HEIC)
  - Duplicate detection using perceptual hashing
  - Blur detection
  - Face detection and validation (size, position, multiple faces)

## Project Structure

- `/client` - React/TypeScript frontend 
- `/server` - Express/TypeScript backend
  - `/src/controllers` - Request handlers
  - `/src/routes` - API routes
  - `/src/services` - Business logic
  - `/src/repositories` - Data access layer (Prisma)
  - `/src/utils` - Utility functions
  - `/prisma` - Database schema
- `.github/workflows` - CI/CD configuration
- `docker-compose.yml` - Docker Compose configuration for local deployment

## API Endpoints

### Image Management
- `POST /api/images`: Upload a single image
- `POST /api/images/batch-upload`: Upload multiple images
- `GET /api/images`: Get all images with filtering
- `GET /api/images/deleted`: Get soft-deleted images (admin function)
- `GET /api/images/user/:userId`: Get images by user ID
- `GET /api/images/:id`: Get an image by ID
- `PATCH /api/images/:id/soft-delete`: Soft delete an image
- `PATCH /api/images/:id/restore`: Restore a soft-deleted image
- `DELETE /api/images/:id`: Hard delete an image

### Batch Management
- `POST /api/batches`: Create a new batch
- `GET /api/batches`: Get all batches with filtering
- `GET /api/batches/user/:userId`: Get batches by user ID
- `GET /api/batches/:id`: Get a batch by ID
- `PUT /api/batches/:id`: Update a batch
- `DELETE /api/batches/:id`: Delete a batch

## Development Setup

### Server

```bash
cd server
npm install
npm run dev
```

The server will start on port 5000 (or as specified in .env file).

### Client

```bash
cd client
npm install
npm start
```

The client will start on port 3000.

## Production Build

### Manual Build

```bash
# Server
cd server
npm ci
npm run build:prod

# Client
cd ../client
npm ci
npm run build
```

### Using Deployment Script

```bash
# Make the script executable (first time only)
chmod +x deploy.sh

# Run the deployment script
./deploy.sh
```

## Docker Deployment

This project is configured for Docker deployment with multi-stage builds for optimization.

### Building and Running Docker Containers

```bash
# Build the containers
docker-compose build

# Run the entire stack
docker-compose up -d

# Stop the stack
docker-compose down
```

### Production Deployment

1. Update `.env.production` files in both client and server directories with your production settings
2. Update Docker registry information in `deploy.yml` and `deploy.sh`
3. Set up secrets in your GitHub repository for CI/CD pipeline
4. Push to main branch to trigger automatic deployment (if CI/CD is configured)

## Environment Configuration

- Production environments use `.env.production` files
- Development environments use `.env.development` files
- Docker containers are pre-configured for production settings

## Technologies Used

- **Frontend**: React, TypeScript, NGINX (for production serving)
- **Backend**: Express.js, TypeScript, Node.js
- **DevOps**: Docker, Docker Compose, GitHub Actions
- **Security**: Helmet for HTTP headers, CORS configuration, environment isolation

## Security Considerations

- Production builds use secure HTTP headers via Helmet
- Docker containers run Node.js processes as non-root user
- Environment variables are used for all sensitive configuration
- Stack errors are hidden from users in production
