import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsOptional, IsString } from 'class-validator';

export class CreateOrderDto {
 @ApiProperty({ example: 'uuid-of-address' })
 @IsUUID()
 addressId: string;

 @ApiProperty({ example: 'Please deliver between 2pm-5pm', required: false })
 @IsOptional()
 @IsString()
 notes?: string;
}