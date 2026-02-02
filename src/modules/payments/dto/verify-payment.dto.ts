import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class VerifyPaymentDto {
 @ApiProperty({ example: 'paystack-reference-string' })
 @IsString()
 @IsNotEmpty({ message: 'Payment reference is required' })
 reference: string;
}