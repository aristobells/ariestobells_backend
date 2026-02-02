import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateCategoryDto {
 @ApiProperty({ example: 'Formal Shoes' })
 @IsString()
 @IsNotEmpty({ message: 'Category name is required' })
 name: string;

 @ApiProperty({ example: 'Premium handmade formal shoes for special occasions', required: false })
 @IsOptional()
 @IsString()
 description?: string;

 @ApiProperty({ example: 'https://example.com/category-image.jpg', required: false })
 @IsOptional()
 @IsString()
 imageUrl?: string;
}