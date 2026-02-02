import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { UsersService } from './users.service';
import { CurrentUser } from 'src/common/decorators/current-user.decprator';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

@ApiTags('User Addresses')
@Controller('users/addresses')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Post()
  @ApiOperation({ summary: 'Create a new address' })
  @ApiResponse({ status: 201, description: 'Address created successfully' })

  createAddress(
    @CurrentUser() user: any,
    @Body() createAddressDto: CreateAddressDto,
  ) {
    return this.usersService.createAddress(user.id, createAddressDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all user addresses' })
  @ApiResponse({ status: 200, description: 'Addresses retrieved successfully' })
  getAddresses(@CurrentUser() user: any) {
    return this.usersService.getAddresses(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get address by ID' })
  @ApiResponse({ status: 200, description: 'Address retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Address not found' })
  getAddress(@CurrentUser() user: any, @Param('id') id: string) {
    return this.usersService.getAddress(user.id, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update address' })
  @ApiResponse({ status: 200, description: 'Address updated successfully' })
  @ApiResponse({ status: 404, description: 'Address not found' })
  updateAddress(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() updateAddressDto: UpdateAddressDto,
  ) {
    return this.usersService.updateAddress(user.id, id, updateAddressDto);
  }

  @Patch(':id/set-default')
  @ApiOperation({ summary: 'Set address as default' })
  @ApiResponse({ status: 200, description: 'Default address set successfully' })
  @ApiResponse({ status: 404, description: 'Address not found' })
  setDefaultAddress(@CurrentUser() user: any, @Param('id') id: string) {
    return this.usersService.setDefaultAddress(user.id, id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete address' })
  @ApiResponse({ status: 200, description: 'Address deleted successfully' })
  @ApiResponse({ status: 404, description: 'Address not found' })
  deleteAddress(@CurrentUser() user: any, @Param('id') id: string) {
    return this.usersService.deleteAddress(user.id, id);
  }
}