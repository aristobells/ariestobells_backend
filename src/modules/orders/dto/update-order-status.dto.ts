import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { OrderStatus } from '@prisma/client';

export class UpdateOrderStatusDto {
 @ApiProperty({
  enum: OrderStatus,
  example: OrderStatus.PROCESSING
 })
 @IsEnum(OrderStatus, { message: 'Invalid order status' })
 status: OrderStatus;
}