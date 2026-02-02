import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsNotEmpty, IsNumber, Min } from 'class-validator';

export class AddToCartDto {
 @ApiProperty({ example: 'uuid-of-product' })
 @IsUUID()
 @IsNotEmpty({ message: 'Product ID is required' })
 productId: string;

 @ApiProperty({ example: 'uuid-of-variant' })
 @IsUUID()
 @IsNotEmpty({ message: 'Variant ID is required' })
 variantId: string;

 @ApiProperty({ example: 1, default: 1 })
 @IsNumber()
 @Min(1, { message: 'Quantity must be at least 1' })
 quantity: number = 1;
}