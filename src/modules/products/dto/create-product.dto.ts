import { ApiProperty } from '@nestjs/swagger';
import {
 IsString,
 IsNotEmpty,
 IsNumber,
 IsBoolean,
 IsOptional,
 IsUUID,
 Min,
 IsArray,
 ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ProductVariantDto {
 @ApiProperty({ example: '42' })
 @IsString()
 @IsNotEmpty()
 size: string;

 @ApiProperty({ example: 'Brown' })
 @IsString()
 @IsNotEmpty()
 color: string;

 @ApiProperty({ example: 'ARIES-BROWN-42' })
 @IsString()
 @IsNotEmpty()
 sku: string;

 @ApiProperty({ example: 10 })
 @IsNumber()
 @Min(0)
 stock: number;

 @ApiProperty({ example: 15000, required: false })
 @IsOptional()
 @IsNumber()
 @Min(0)
 price?: number;
}

export class CreateProductDto {
 @ApiProperty({ example: 'Classic Oxford Leather Shoes' })
 @IsString()
 @IsNotEmpty({ message: 'Product name is required' })
 name: string;

 @ApiProperty({ example: 'Handcrafted premium leather oxford shoes with rubber sole' })
 @IsString()
 @IsNotEmpty({ message: 'Description is required' })
 description: string;

 @ApiProperty({ example: 25000 })
 @IsNumber()
 @Min(0, { message: 'Price must be a positive number' })
 price: number;

 @ApiProperty({ example: 'uuid-of-category' })
 @IsUUID()
 @IsNotEmpty({ message: 'Category ID is required' })
 categoryId: string;

 @ApiProperty({ example: true, required: false })
 @IsOptional()
 @IsBoolean()
 isFeatured?: boolean;

 @ApiProperty({
  type: [ProductVariantDto],
  example: [
   { size: '42', color: 'Brown', sku: 'ARIES-BROWN-42', stock: 10 },
   { size: '43', color: 'Brown', sku: 'ARIES-BROWN-43', stock: 5 }
  ]
 })
 @IsArray()
 @ValidateNested({ each: true })
 @Type(() => ProductVariantDto)
 variants: ProductVariantDto[];

 @ApiProperty({
  type: [String],
  example: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
  required: false
 })
 @IsOptional()
 @IsArray()
 @IsString({ each: true })
 imageUrls?: string[];
}