import { Module } from '@nestjs/common';
import { UploadService } from './upload.service';
import { UploadController } from './upload.controller';
import { CloudinaryProvider } from 'src/config/cloudinary.config';

@Module({
  controllers: [UploadController],
  providers: [UploadService, CloudinaryProvider],
  exports: [UploadService],
})
export class UploadModule { }
