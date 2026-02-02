import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsBoolean, IsOptional } from 'class-validator';

export class CreateAddressDto {
 @ApiProperty({ example: 'John Doe' })
 @IsString()
 @IsNotEmpty({ message: 'Full name is required' })
 fullName: string;

 @ApiProperty({ example: '+2348012345678' })
 @IsString()
 @IsNotEmpty({ message: 'Phone is required' })
 phone: string;

 @ApiProperty({ example: '123 Main Street, Apartment 4B' })
 @IsString()
 @IsNotEmpty({ message: 'Address is required' })
 address: string;

 @ApiProperty({ example: 'Lagos' })
 @IsString()
 @IsNotEmpty({ message: 'City is required' })
 city: string;

 @ApiProperty({ example: 'Lagos' })
 @IsString()
 @IsNotEmpty({ message: 'State is required' })
 state: string;

 @ApiProperty({ example: 'Nigeria' })
 @IsString()
 @IsNotEmpty({ message: 'Country is required' })
 country: string;

 @ApiProperty({ example: '100001' })
 @IsString()
 @IsNotEmpty({ message: 'Postal code is required' })
 postalCode: string;

 @ApiProperty({ example: false, default: false })
 @IsOptional()
 @IsBoolean()
 isDefault?: boolean;
}