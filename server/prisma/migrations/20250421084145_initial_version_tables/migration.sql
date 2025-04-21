-- CreateEnum
CREATE TYPE "ImageStatus" AS ENUM ('PROCESSING', 'VALIDATED', 'REJECTED', 'ERROR');

-- CreateEnum
CREATE TYPE "BatchStatus" AS ENUM ('PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "ValidationType" AS ENUM ('SIZE_VALIDATION', 'FORMAT_VALIDATION', 'DUPLICATE_DETECTION', 'BLUR_DETECTION', 'FACE_SIZE_VALIDATION', 'MULTIPLE_FACES_VALIDATION');

-- CreateTable
CREATE TABLE "Batch" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "status" "BatchStatus" NOT NULL DEFAULT 'PROCESSING',
    "completedAt" TIMESTAMP(3),
    "totalImages" INTEGER NOT NULL DEFAULT 0,
    "processedImages" INTEGER NOT NULL DEFAULT 0,
    "validImages" INTEGER NOT NULL DEFAULT 0,
    "rejectedImages" INTEGER NOT NULL DEFAULT 0,
    "errorImages" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Batch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Image" (
    "id" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "s3Key" TEXT NOT NULL,
    "s3Url" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "status" "ImageStatus" NOT NULL DEFAULT 'PROCESSING',
    "userId" TEXT NOT NULL,
    "hash" TEXT,
    "blurScore" DOUBLE PRECISION,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "rejectionReason" TEXT,
    "batchId" TEXT NOT NULL,
    "description" TEXT,
    "tags" TEXT[],

    CONSTRAINT "Image_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProcessingInfo" (
    "id" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "processingTimeMs" INTEGER,
    "convertedFromHeic" BOOLEAN NOT NULL DEFAULT false,
    "error" TEXT,
    "imageId" TEXT NOT NULL,

    CONSTRAINT "ProcessingInfo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FaceInfo" (
    "id" TEXT NOT NULL,
    "faceCount" INTEGER NOT NULL DEFAULT 0,
    "primaryFaceArea" DOUBLE PRECISION,
    "confidence" DOUBLE PRECISION,
    "boundingBox" JSONB,
    "landmarks" JSONB,
    "imageId" TEXT NOT NULL,

    CONSTRAINT "FaceInfo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ValidationResult" (
    "id" TEXT NOT NULL,
    "type" "ValidationType" NOT NULL,
    "passed" BOOLEAN NOT NULL,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "value" DOUBLE PRECISION,
    "imageId" TEXT NOT NULL,

    CONSTRAINT "ValidationResult_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Batch_userId_idx" ON "Batch"("userId");

-- CreateIndex
CREATE INDEX "Batch_status_idx" ON "Batch"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Image_s3Key_key" ON "Image"("s3Key");

-- CreateIndex
CREATE INDEX "Image_status_idx" ON "Image"("status");

-- CreateIndex
CREATE INDEX "Image_hash_idx" ON "Image"("hash");

-- CreateIndex
CREATE INDEX "Image_userId_idx" ON "Image"("userId");

-- CreateIndex
CREATE INDEX "Image_batchId_idx" ON "Image"("batchId");

-- CreateIndex
CREATE INDEX "Image_isDeleted_idx" ON "Image"("isDeleted");

-- CreateIndex
CREATE UNIQUE INDEX "ProcessingInfo_imageId_key" ON "ProcessingInfo"("imageId");

-- CreateIndex
CREATE UNIQUE INDEX "FaceInfo_imageId_key" ON "FaceInfo"("imageId");

-- CreateIndex
CREATE INDEX "ValidationResult_imageId_idx" ON "ValidationResult"("imageId");

-- CreateIndex
CREATE INDEX "ValidationResult_type_idx" ON "ValidationResult"("type");

-- CreateIndex
CREATE INDEX "ValidationResult_passed_idx" ON "ValidationResult"("passed");

-- AddForeignKey
ALTER TABLE "Image" ADD CONSTRAINT "Image_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcessingInfo" ADD CONSTRAINT "ProcessingInfo_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "Image"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FaceInfo" ADD CONSTRAINT "FaceInfo_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "Image"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ValidationResult" ADD CONSTRAINT "ValidationResult_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "Image"("id") ON DELETE CASCADE ON UPDATE CASCADE;
