import { prisma } from '../config/database';
import { 
  Image, 
  ImageStatus, 
  Prisma, 
  ValidationResult, 
  ValidationType, 
  ProcessingInfo, 
  FaceInfo 
} from '@prisma/client';

/**
 * Repository for Image-related database operations
 */
export const imageRepository = {
  /**
   * Create a new image record
   */
  create: async (data: Prisma.ImageCreateInput): Promise<Image> => {
    return prisma.image.create({
      data,
      include: {
        processingInfo: true
      }
    });
  },

  /**
   * Get an image by ID
   * If includeDeleted is true, will return even if the image is soft-deleted
   */
  findById: async (id: string, includeRelations = true, includeDeleted = false): Promise<Image | null> => {
    // findUnique doesn't support multiple conditions in where clause, so we need to use findFirst
    return prisma.image.findFirst({
      where: { 
        id,
        isDeleted: includeDeleted ? undefined : false
      },
      include: includeRelations ? {
        processingInfo: true,
        faceInfo: true,
        validationResults: true,
        batch: true
      } : undefined
    });
  },

  /**
   * Find images with filters
   */
  findMany: async (params: {
    where?: Prisma.ImageWhereInput;
    orderBy?: Prisma.ImageOrderByWithRelationInput;
    skip?: number;
    take?: number;
    includeRelations?: boolean;
  }): Promise<Image[]> => {
    const { where = {}, orderBy, skip, take, includeRelations = true } = params;
    
    // Always filter out soft-deleted images unless explicitly requested
    const finalWhere = {
      ...where,
      isDeleted: where.isDeleted !== undefined ? where.isDeleted : false
    };
    
    return prisma.image.findMany({
      where: finalWhere,
      orderBy,
      skip,
      take,
      include: includeRelations ? {
        processingInfo: true,
        faceInfo: true,
        validationResults: true,
        batch: {
          select: {
            id: true,
            name: true,
            status: true
          }
        }
      } : undefined
    });
  },

  /**
   * Count images with filters
   */
  count: async (where: Prisma.ImageWhereInput = {}): Promise<number> => {
    // Always filter out soft-deleted images unless explicitly requested
    const finalWhere = {
      ...where,
      isDeleted: where.isDeleted !== undefined ? where.isDeleted : false
    };
    
    return prisma.image.count({ where: finalWhere });
  },

  /**
   * Update an image
   */
  update: async (id: string, data: Prisma.ImageUpdateInput): Promise<Image> => {
    return prisma.image.update({
      where: { id },
      data,
      include: {
        processingInfo: true,
        faceInfo: true,
        validationResults: true
      }
    });
  },

  /**
   * Soft delete an image
   */
  softDelete: async (id: string): Promise<Image> => {
    return prisma.image.update({
      where: { id },
      data: { 
        isDeleted: true,
        updatedAt: new Date()
      },
      include: {
        processingInfo: true,
        faceInfo: true
      }
    });
  },

  /**
   * Hard delete an image
   */
  hardDelete: async (id: string): Promise<Image> => {
    return prisma.image.delete({
      where: { id },
      include: {
        processingInfo: true,
        faceInfo: true
      }
    });
  },

  /**
   * Find duplicate images by hash
   */
  findDuplicateByHash: async (hash: string, imageId: string): Promise<Image | null> => {
    return prisma.image.findFirst({
      where: {
        hash,
        id: { not: imageId },
        status: ImageStatus.VALIDATED,
        isDeleted: false
      }
    });
  },

  /**
   * Update image status with rejection reason
   */
  updateStatus: async (id: string, status: ImageStatus, rejectionReason?: string): Promise<Image> => {
    return prisma.image.update({
      where: { id },
      data: { 
        status,
        rejectionReason: status === ImageStatus.REJECTED ? rejectionReason : undefined,
        updatedAt: new Date()
      }
    });
  },

  /**
   * Add validation result
   */
  addValidationResult: async (data: {
    imageId: string;
    type: ValidationType;
    passed: boolean;
    details?: any;
    value?: number;
  }): Promise<ValidationResult> => {
    return prisma.validationResult.create({
      data: {
        type: data.type,
        passed: data.passed,
        details: data.details ? data.details : undefined,
        value: data.value,
        image: {
          connect: { id: data.imageId }
        }
      }
    });
  },

  /**
   * Get validation results for an image
   */
  getValidationResults: async (imageId: string): Promise<ValidationResult[]> => {
    return prisma.validationResult.findMany({
      where: { imageId }
    });
  },

  /**
   * Get failed validations
   */
  getFailedValidations: async (imageId: string): Promise<ValidationResult[]> => {
    return prisma.validationResult.findMany({
      where: { 
        imageId,
        passed: false
      }
    });
  },
  
  /**
   * Find deleted images (for admin/recovery purposes)
   */
  findDeleted: async (params: {
    where?: Prisma.ImageWhereInput;
    orderBy?: Prisma.ImageOrderByWithRelationInput;
    skip?: number;
    take?: number;
    includeRelations?: boolean;
  }): Promise<Image[]> => {
    const { where = {}, orderBy, skip, take, includeRelations = true } = params;
    
    // Force isDeleted = true
    const finalWhere = {
      ...where,
      isDeleted: true
    };
    
    return prisma.image.findMany({
      where: finalWhere,
      orderBy,
      skip,
      take,
      include: includeRelations ? {
        processingInfo: true,
        faceInfo: true,
        validationResults: true,
        batch: {
          select: {
            id: true,
            name: true,
            status: true
          }
        }
      } : undefined
    });
  },
  
  /**
   * Restore a soft-deleted image
   */
  restore: async (id: string): Promise<Image> => {
    return prisma.image.update({
      where: { id },
      data: { 
        isDeleted: false,
        updatedAt: new Date()
      },
      include: {
        processingInfo: true,
        faceInfo: true,
        validationResults: true
      }
    });
  }
};