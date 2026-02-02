import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MinLength, Matches } from 'class-validator';

export class ResetPasswordDto {
 @ApiProperty({ example: 'reset-token-string' })
 @IsString()
 @IsNotEmpty({ message: 'Token is required' })
 token: string;

 @ApiProperty({ example: 'NewPassword123!' })
 @IsString()
 @IsNotEmpty({ message: 'Password is required' })
 @MinLength(8, { message: 'Password must be at least 8 characters long' })
 @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
  message: 'Password must contain uppercase, lowercase, and number/special character',
 })
 newPassword: string;
}