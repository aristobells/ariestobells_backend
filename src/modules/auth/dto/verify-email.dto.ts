import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class VerifyEmailDto {
 @ApiProperty({ example: 'verification-token-string' })
 @IsString()
 @IsNotEmpty({ message: 'Token is required' })
 token: string;
}