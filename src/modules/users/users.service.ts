import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

@Injectable()
export class UsersService {
 constructor(
  private prisma: PrismaService
 ) { }

 async createAddress(userId: string, createAddressDto: CreateAddressDto) {
  const { isDefault, ...addressData } = createAddressDto;

  // If this is set as default, unset all other default addresses
  if (isDefault) {
   await this.prisma.address.updateMany({
    where: { userId },
    data: { isDefault: false },
   });
  }

  return this.prisma.address.create({
   data: {
    ...addressData,
    userId,
    isDefault: isDefault || false,
   },
  });
 }

 async getAddresses(userId: string) {
  return this.prisma.address.findMany({
   where: { userId },
   orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }]
  });
 }

 async getAddress(userId: string, addressId: string) {
  const address = await this.prisma.address.findFirst({
   where: { id: addressId, userId }
  });

  if (!address) {
   throw new NotFoundException('Address not found');
  }
  return address;
 }


 async updateAddress(
  userId: string,
  addressId: string,
  updateAddressDto: UpdateAddressDto,
 ) {
  await this.getAddress(userId, addressId); // Verify ownership

  const { isDefault, ...addressData } = updateAddressDto;

  // If setting as default, unset all other default addresses
  if (isDefault) {
   await this.prisma.address.updateMany({
    where: { userId },
    data: { isDefault: false },
   });
  }

  return this.prisma.address.update({
   where: { id: addressId },
   data: {
    ...addressData,
    ...(isDefault !== undefined && { isDefault }),
   },
  });
 }
 async deleteAddress(userId: string, addressId: string) {
  await this.getAddress(userId, addressId); // Verify ownership
  return this.prisma.address.delete({
   where: { id: addressId }
  });
 }

 async setDefaultAddress(userId: string, addressId: string) {
  await this.getAddress(userId, addressId); // Verify ownership

  // Unset other default addresses
  await this.prisma.address.updateMany({
   where: { userId },
   data: { isDefault: false }
  });

  // Set the specified address as default
  return this.prisma.address.update({
   where: { id: addressId },
   data: { isDefault: true }
  });
 }

}
