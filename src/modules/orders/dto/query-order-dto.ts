import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { OrderStatus, PaymentStatus } from '@prisma/client';

export class QueryOrderDto {
 @ApiPropertyOptional({ enum: OrderStatus })
 @IsOptional()
 @IsEnum(OrderStatus)
 status?: OrderStatus;

 @ApiPropertyOptional({ enum: PaymentStatus })
 @IsOptional()
 @IsEnum(PaymentStatus)
 paymentStatus?: PaymentStatus;

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
}