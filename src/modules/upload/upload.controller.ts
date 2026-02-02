import {
  Controller,
  Post,
  Delete,
  Body,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';

import { Role } from '@prisma/client';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { UploadService } from './upload.service';
import { FileValidationInterceptor } from 'src/common/interceptors/file-validation.interceptor';
import { Roles } from 'src/common/decorators/roles.decorator';

@ApiTags('Upload')
@Controller('upload')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class UploadController {
  constructor(private readonly uploadService: UploadService) { }

  @Post('image')
  @Roles(Role.ADMIN)
  @UseInterceptors(
    FileInterceptor('file'),
    new FileValidationInterceptor(5 * 1024 * 1024), // 5MB max
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload single image (Admin only)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Image uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Invalid file or file too large' })
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const result = await this.uploadService.uploadImage(file, 'ariestobells/products');

    return {
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
      resourceType: result.resource_type,
    };
  }

  @Post('images')
  @Roles(Role.ADMIN)
  @UseInterceptors(
    FilesInterceptor('files', 10), // Max 10 files
    new FileValidationInterceptor(5 * 1024 * 1024), // 5MB max per file
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload multiple images (Admin only)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Images uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Invalid files or files too large' })
  async uploadMultipleImages(@UploadedFiles() files: Express.Multer.File[]) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }

    if (files.length > 10) {
      throw new BadRequestException('Maximum 10 files allowed');
    }

    const results = await this.uploadService.uploadMultipleImages(
      files,
      'ariestobells/products',
    );

    const images = results.map((result) => ({
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
      resourceType: result.resource_type,
    }));

    return {
      images,
      count: images.length,
    };
  }

  @Post('category-image')
  @Roles(Role.ADMIN)
  @UseInterceptors(
    FileInterceptor('file'),
    new FileValidationInterceptor(5 * 1024 * 1024),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload category image (Admin only)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Category image uploaded successfully' })
  async uploadCategoryImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const result = await this.uploadService.uploadImage(file, 'ariestobells/categories');

    return {
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
      resourceType: result.resource_type,
    };
  }

  @Delete('image')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete image (Admin only)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        publicId: {
          type: 'string',
          example: 'ariestobells/products/abc123',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Image deleted successfully' })
  async deleteImage(@Body('publicId') publicId: string) {
    if (!publicId) {
      throw new BadRequestException('Public ID is required');
    }

    const result = await this.uploadService.deleteImage(publicId);

    return {
      message: 'Image deleted successfully',
      result,
    };
  }

  @Delete('images')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete multiple images (Admin only)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        publicIds: {
          type: 'array',
          items: { type: 'string' },
          example: ['ariestobells/products/abc123', 'ariestobells/products/def456'],
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Images deleted successfully' })
  async deleteMultipleImages(@Body('publicIds') publicIds: string[]) {
    if (!publicIds || publicIds.length === 0) {
      throw new BadRequestException('Public IDs are required');
    }

    const result = await this.uploadService.deleteMultipleImages(publicIds);

    return {
      message: 'Images deleted successfully',
      result,
    };
  }
}