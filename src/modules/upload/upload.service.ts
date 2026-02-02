import { Injectable, BadRequestException } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';
import * as streamifier from 'streamifier';

@Injectable()
export class UploadService {
 async uploadImage(
  file: Express.Multer.File,
  folder: string = 'ariestobells',
 ): Promise<UploadApiResponse> {
  return new Promise((resolve, reject) => {
   const uploadStream = cloudinary.uploader.upload_stream(
    {
     folder,
     resource_type: 'auto',
     transformation: [
      { width: 1000, height: 1000, crop: 'limit' },
      { quality: 'auto:good' },
      { fetch_format: 'auto' },
     ],
    },
    (error: UploadApiErrorResponse, result: UploadApiResponse) => {
     if (error) {
      reject(new BadRequestException('Image upload failed'));
     } else {
      resolve(result);
     }
    },
   );

   streamifier.createReadStream(file.buffer).pipe(uploadStream);
  });
 }

 async uploadMultipleImages(
  files: Express.Multer.File[],
  folder: string = 'ariestobells',
 ): Promise<UploadApiResponse[]> {
  const uploadPromises = files.map((file) => this.uploadImage(file, folder));
  return Promise.all(uploadPromises);
 }

 async deleteImage(publicId: string): Promise<any> {
  try {
   const result = await cloudinary.uploader.destroy(publicId);
   return result;
  } catch (error) {
   throw new BadRequestException('Image deletion failed');
  }
 }

 async deleteMultipleImages(publicIds: string[]): Promise<any> {
  try {
   const result = await cloudinary.api.delete_resources(publicIds);
   return result;
  } catch (error) {
   throw new BadRequestException('Images deletion failed');
  }
 }

 extractPublicId(imageUrl: string): string {
  // Extract public_id from Cloudinary URL
  // Example: https://res.cloudinary.com/demo/image/upload/v1234567890/ariestobells/product.jpg
  const parts = imageUrl.split('/');
  const uploadIndex = parts.indexOf('upload');
  if (uploadIndex === -1) return '';

  // Get everything after 'upload/v{version}/'
  const pathParts = parts.slice(uploadIndex + 2);
  const publicIdWithExtension = pathParts.join('/');

  // Remove file extension
  const publicId = publicIdWithExtension.substring(0, publicIdWithExtension.lastIndexOf('.'));
  return publicId;
 }
}