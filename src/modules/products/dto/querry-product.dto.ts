import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, Min, IsBoolean, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryProductDto {
 @ApiPropertyOptional({ example: 'leather shoes' })
 @IsOptional()
 @IsString()
 search?: string;

 @ApiPropertyOptional({ example: 'uuid-of-category' })
 @IsOptional()
 @IsUUID()
 categoryId?: string;

 @ApiPropertyOptional({ example: 10000 })
 @IsOptional()
 @Type(() => Number)
 @IsNumber()
 @Min(0)
 minPrice?: number;

 @ApiPropertyOptional({ example: 50000 })
 @IsOptional()
 @Type(() => Number)
 @IsNumber()
 @Min(0)
 maxPrice?: number;

 @ApiPropertyOptional({ example: true })
 @IsOptional()
 @Type(() => Boolean)
 @IsBoolean()
 isFeatured?: boolean;

 @ApiPropertyOptional({ example: 1, default: 1 })
 @IsOptional()
 @Type(() => Number)
 @IsNumber()
 @Min(1)
 page?: number = 1;

 @ApiPropertyOptional({ example: 10, default: 10 })
 @IsOptional()
 @Type(() => Number)
 @IsNumber()
 @Min(1)
 limit?: number = 10;

 @ApiPropertyOptional({ example: 'createdAt', default: 'createdAt' })
 @IsOptional()
 @IsString()
 sortBy?: string = 'createdAt';

 @ApiPropertyOptional({ example: 'desc', default: 'desc' })
 @IsOptional()
 @IsString()
 sortOrder?: 'asc' | 'desc' = 'desc';
}