import { ApiProperty } from '@nestjs/swagger';

export class UploadResponseDto {
 @ApiProperty()
 url: string;

 @ApiProperty()
 publicId: string;

 @ApiProperty()
 width: number;

 @ApiProperty()
 height: number;

 @ApiProperty()
 format: string;

 @ApiProperty()
 resourceType: string;
}

export class MultipleUploadResponseDto {
 @ApiProperty({ type: [UploadResponseDto] })
 images: UploadResponseDto[];

 @ApiProperty()
 count: number;
}