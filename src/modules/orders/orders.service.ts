import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderStatus } from '@prisma/client';
import { QueryOrderDto } from './dto/query-order-dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

@Injectable()
export class OrdersService {
 constructor(private prisma: PrismaService) { }

 async createOrder(userId: string, createOrderDto: CreateOrderDto) {
  const { addressId, notes } = createOrderDto;

  // verify that address belongs to user
  const address = await this.prisma.address.findFirst({
   where: { id: addressId, userId }
  });

  if (!address) {
   throw new NotFoundException('Address not found');
  }

  // get user's cart items
  const cart = await this.prisma.cart.findUnique({
   where: { userId },
   include: {
    items: {
     include: { product: true, variant: true }
    }
   }
  });

  if (!cart || cart.items.length === 0) {
   throw new NotFoundException('No items in cart');
  }

  // validate stock for each item
  for (const item of cart.items) {
   if (item.variant.stock < item.quantity) {
    throw new NotFoundException(`Insufficient stock for ${item.product.name} (${item.variant.size}/${item.variant.color})`);
   }
  }

  // calculate subtotal
  let subtotal = 0;
  for (const item of cart.items) {
   const price = item.variant.price ? Number(item.variant.price) : Number(item.product.price)
   subtotal += price * item.quantity;
  }

  const shippingCost = 3000; // ₦3000 flat shipping
  const tax = subtotal * 0.075; // 7.5% VAT
  const total = subtotal + shippingCost + tax;

  // generate order number
  const orderNumber = await this.generateOrderNumber();
  // create order 
  const order = await this.prisma.$transaction(async (tx) => {
   const newOrder = await tx.order.create({
    data: {
     userId,
     addressId,
     orderNumber,
     notes,
     subtotal,
     shippingCost,
     tax,
     total,
     status: OrderStatus.PENDING,
     paymentStatus: OrderStatus.PENDING,
     items: {
      create: cart.items.map(item => ({
       productId: item.productId,
       variantId: item.variantId,
       quantity: item.quantity,
       price: item.variant.price ? Number(item.variant.price) : Number(item.product.price),
      })),
     },
    },
    include: {
     items: {
      include: {
       product: {
        include: {
         images: { where: { isPrimary: true }, take: 1 }
        },
       },
       variant: true
      },
     },
     address: true,
    }
   });
   // decrement stock for each item
   for (const item of cart.items) {
    await tx.productVariant.update({
     where: { id: item.variantId },
     data: {
      stock: {
       decrement: item.quantity,
      },
     },
    });
   }
   // clear user's cart
   await tx.cartItem.deleteMany({
    where: { cartId: cart.id },
   });
   return
  })
  return order;
 }

 async findAll(userId: string, queryDto: QueryOrderDto, isAdmin: boolean = false) {
  const { status, paymentStatus, page = 1, limit = 10 } = queryDto;
  const skip = (page - 1) * limit;
  const where: any = {};
  // If not admin, only show user's orders
  if (!isAdmin) {
   where.userId = userId;
  }

  if (status) {
   where.status = status;
  }

  if (paymentStatus) {
   where.paymentStatus = paymentStatus;
  }
  const total = await this.prisma.order.count({ where });

  const orders = await this.prisma.order.findMany({
   where,
   skip,
   take: limit,
   orderBy: { createdAt: 'desc' },
   include: {
    items: {
     include: {
      product: {
       include: {
        images: {
         where: { isPrimary: true },
         take: 1,
        },
       },
      },
      variant: true,
     },
    },
    address: true,
    user: {
     select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
     },
    },
   },
  });

  return {
   data: orders,
   meta: {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
   },
  };
 }

 async findOne(userId: string, orderId: string, isAdmin: boolean = false) {
  const order = await this.prisma.order.findUnique({
   where: { id: orderId },
   include: {
    items: {
     include: {
      product: {
       include: {
        images: true,
        category: true,
       },
      },
      variant: true,
     },
    },
    address: true,
    user: {
     select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
     },
    },
    payment: true,
   },
  });

  if (!order) {
   throw new NotFoundException('Order not found');
  }

  // If not admin, verify order belongs to user
  if (!isAdmin && order.userId !== userId) {
   throw new ForbiddenException('Access denied');
  }

  return order;
 }


 async updateStatus(orderId: string, updateOrderStatusDto: UpdateOrderStatusDto) {
  const order = await this.prisma.order.findUnique({
   where: { id: orderId },
  });

  if (!order) {
   throw new NotFoundException('Order not found');
  }

  return this.prisma.order.update({
   where: { id: orderId },
   data: {
    status: updateOrderStatusDto.status,
   },
   include: {
    items: {
     include: {
      product: true,
      variant: true,
     },
    },
    address: true,
   },
  });
 }


 async cancelOrder(userId: string, orderId: string) {
  const order = await this.prisma.order.findFirst({
   where: {
    id: orderId,
    userId,
   },
   include: {
    items: {
     include: {
      variant: true,
     },
    },
   },
  });

  if (!order) {
   throw new NotFoundException('Order not found');
  }

  // Only allow cancellation if order is pending or processing
  const allowedStatuses: OrderStatus[] = [
   OrderStatus.PENDING,
   OrderStatus.PROCESSING,
  ];  // needed to define allowedStatuses type to silence typescript error
  if (!allowedStatuses.includes(order.status)) {
   throw new BadRequestException('Order cannot be cancelled at this stage');
  }

  // Restore stock in a transaction
  await this.prisma.$transaction(async (tx) => {
   // Update order status
   await tx.order.update({
    where: { id: orderId },
    data: {
     status: OrderStatus.CANCELLED,
    },
   });

   // Restore stock for each item
   for (const item of order.items) {
    await tx.productVariant.update({
     where: { id: item.variantId },
     data: {
      stock: {
       increment: item.quantity,
      },
     },
    });
   }
  });

  return { message: 'Order cancelled successfully' };
 }

 async getOrderStats(userId?: string) {
  const where = userId ? { userId } : {};

  const [
   totalOrders,
   pendingOrders,
   processingOrders,
   shippedOrders,
   deliveredOrders,
   cancelledOrders,
  ] = await Promise.all([
   this.prisma.order.count({ where }),
   this.prisma.order.count({ where: { ...where, status: OrderStatus.PENDING } }),
   this.prisma.order.count({ where: { ...where, status: OrderStatus.PROCESSING } }),
   this.prisma.order.count({ where: { ...where, status: OrderStatus.SHIPPED } }),
   this.prisma.order.count({ where: { ...where, status: OrderStatus.DELIVERED } }),
   this.prisma.order.count({ where: { ...where, status: OrderStatus.CANCELLED } }),
  ]);

  const totalRevenue = await this.prisma.order.aggregate({
   where: {
    ...where,
    status: { not: OrderStatus.CANCELLED },
   },
   _sum: {
    total: true,
   },
  });

  return {
   totalOrders,
   pendingOrders,
   processingOrders,
   shippedOrders,
   deliveredOrders,
   cancelledOrders,
   totalRevenue: totalRevenue._sum.total || 0,
  };
 }


 private async generateOrderNumber(): Promise<string> {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  // Count orders for today
  const startOfDay = new Date(date.setHours(0, 0, 0, 0));
  const endOfDay = new Date(date.setHours(23, 59, 59, 999));

  const todayOrdersCount = await this.prisma.order.count({
   where: {
    createdAt: {
     gte: startOfDay,
     lte: endOfDay,
    },
   },
  });

  const sequence = String(todayOrdersCount + 1).padStart(4, '0');

  return `ARB${year}${month}${day}${sequence}`;
 }


}
