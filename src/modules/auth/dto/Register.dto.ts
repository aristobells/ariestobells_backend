import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength, Matches } from 'class-validator';

export class RegisterDto {
 @ApiProperty({ example: 'john.doe@example.com' })
 @IsEmail({}, { message: 'Please provide a valid email address' })
 @IsNotEmpty({ message: 'Email is required' })
 email: string;

 @ApiProperty({ example: 'Password123!' })
 @IsString()
 @IsNotEmpty({ message: 'Password is required' })
 @MinLength(8, { message: 'Password must be at least 8 characters long' })
 @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
  message: 'Password must contain uppercase, lowercase, and number/special character',
 })
 password: string;

 @ApiProperty({ example: 'John' })
 @IsString()
 @IsNotEmpty({ message: 'First name is required' })
 firstName: string;

 @ApiProperty({ example: 'Doe' })
 @IsString()
 @IsNotEmpty({ message: 'Last name is required' })
 lastName: string;

 @ApiProperty({ example: '+2348012345678', required: false })
 @IsString()
 phone?: string;
}