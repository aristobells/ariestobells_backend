import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsNotEmpty } from 'class-validator';

export class InitializePaymentDto {
 @ApiProperty({ example: 'uuid-of-order' })
 @IsUUID()
 @IsNotEmpty({ message: 'Order ID is required' })
 orderId: string;
}