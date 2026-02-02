import {
 Injectable,
 NestInterceptor,
 ExecutionContext,
 CallHandler,
 BadRequestException,
} from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class FileValidationInterceptor implements NestInterceptor {
 constructor(
  private readonly maxSize: number = 5 * 1024 * 1024, // 5MB default
  private readonly allowedMimeTypes: string[] = [
   'image/jpeg',
   'image/jpg',
   'image/png',
   'image/webp',
  ],
 ) { }

 intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
  const request = context.switchToHttp().getRequest();
  const file = request.file;
  const files = request.files;

  if (file) {
   this.validateFile(file);
  }

  if (files && Array.isArray(files)) {
   files.forEach((file) => this.validateFile(file));
  }

  return next.handle();
 }

 private validateFile(file: Express.Multer.File) {
  if (!file) {
   throw new BadRequestException('No file uploaded');
  }

  // Check file size
  if (file.size > this.maxSize) {
   throw new BadRequestException(
    `File size exceeds maximum allowed size of ${this.maxSize / (1024 * 1024)}MB`,
   );
  }

  // Check MIME type
  if (!this.allowedMimeTypes.includes(file.mimetype)) {
   throw new BadRequestException(
    `Invalid file type. Allowed types: ${this.allowedMimeTypes.join(', ')}`,
   );
  }
 }
}