import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/prisma.service';
import { InitializePaymentDto } from './dto/initialize-payment.dto';
import { OrderStatus, PaymentStatus } from '@prisma/client';
import axios from 'axios';
import { VerifyPaymentDto } from './dto/verify-payment.dto';
import { PaystackWebhookPayload } from './dto/webhook-payload.dto';
import * as crypto from 'crypto';


@Injectable()
export class PaymentsService {
 private readonly paystackSecretKey: string;
 private readonly paystackBaseUrl = 'https://api.paystack.co';
 constructor(
  private prisma: PrismaService,
  private configService: ConfigService
 ) { this.paystackSecretKey = this.configService.get<string>("PAYSTACK_SECRET_KEY")!; }

 async initializePayment(userId: string, initializePaymentDto: InitializePaymentDto) {

  const { orderId } = initializePaymentDto;

  // Fetch order details
  const order = await this.prisma.order.findUnique({
   where: { id: orderId, userId },
   include: { user: true, payment: true }
  });

  if (!order) {
   throw new NotFoundException('Order not found');
  }
  // Check if order was already paid for
  if (order.paymentStatus === PaymentStatus.COMPLETED) {
   throw new BadRequestException("Order is already paid")
  }

  // check if order was cancelled
  if (order.status === OrderStatus.CANCELLED) {
   throw new BadRequestException("Cannot pay for canclled order")
  }

  //  Referenc generation
  const reference = `ARB_${Date.now()}_${order.id.substring(0, 8)}`;

  try {
   const response = await axios.post(
    `${this.paystackBaseUrl}/transaction/initialize`,
    {
     email: order.user.email,
     amount: Math.round(Number(order.total) * 100),
     reference,
     callback_url: this.configService.get<string>("http://localhost:3000/api/v1/payments/callback"),
     metadata: {
      OrderId: order.id,
      userId: order.userId,
      orderNumber: order.orderNumber
     },
    },
    {
     headers: {
      Authorization: `Bearer ${this.paystackSecretKey}`,
      'Content-Type': 'application/json',
     }
    }
   );

   // create or update payment record
   const payment = await this.prisma.payment.upsert({
    where: { orderId: order.id },
    create: {
     orderId: order.id,
     amount: order.total,
     paymentMethod: 'paystack',
     transactionId: reference,
     status: PaymentStatus.PENDING,
     paymentDetails: {
      reference,
      authorization_url: response.data.data.authorization_url,
      access_code: response.data.data.access_code,
     },
    },
    update: {
     transactionId: reference,
     status: PaymentStatus.PENDING,
     paymentDetails: {
      reference,
      authorization_url: response.data.data.authorization_url,
      access_code: response.data.data.access_code,
     },
    },
   });
   return {
    authorization_url: response.data.data.authorization_url,
    access_code: response.data.data.access_code,
    reference,
    payment,
   };

  } catch (error) {
   throw new BadRequestException(
    error.response?.data?.message || 'Failed to initialize payment',
   );
  }
 }


 async verifyPayment(userId: string, verifyPaymentDto: VerifyPaymentDto) {

  const { reference } = verifyPaymentDto

  try {

   const response = await axios.get(`${this.paystackBaseUrl}/transaction/verify/${reference}`,
    {
     headers: {
      Authorization: `Bearer ${this.paystackSecretKey}`
     },
    },
   );

   const { data } = response.data;
   // find the payment record

   const payment = await this.prisma.payment.findFirst({
    where: { transactionId: reference },
    include: { order: true }
   });

   if (!payment) {
    throw new BadRequestException("payment request not found")
   }

   if (payment.order.userId !== userId) {
    throw new ForbiddenException("Access Denied");
   }

   // Update payment and order status based on verification
   if (data.status === 'success') {

    await this.prisma.$transaction([
     // update payment
     this.prisma.payment.update({
      where: { id: payment.id },
      data: {
       status: PaymentStatus.COMPLETED,
       paymentDetails: {
        ...data,
        verified_at: new Date().toISOString(),
       },
      },
     }),

     // update order
     this.prisma.order.update({
      where: { id: payment.orderId },
      data: {
       paymentStatus: PaymentStatus.COMPLETED,
       status: OrderStatus.PROCESSING,
      },
     }),
    ])

    return {
     status: 'success',
     message: 'Payment verified successfully',
     payment: data,
    };
   } else {
    // payment failed
    await this.prisma.payment.update({
     where: { id: payment.id },
     data: {
      status: PaymentStatus.FAILED,
      paymentDetails: {
       ...data,
       verified_at: new Date().toISOString(),
      }
     }
    });
    return {
     status: 'failed',
     message: 'Payment verification failed',
     payment: data,
    };
   }

  } catch (error) {
   if (error instanceof NotFoundException || error instanceof ForbiddenException) {
    throw error;
   }
   throw new BadRequestException(
    error.response?.data?.message || 'Failed to verify payment',
   );
  }
 }

 // handle ebhook
 async handleWebhook(payload: PaystackWebhookPayload, signature: string) {
  // Verify webhook signature
  const hash = crypto
   .createHmac('sha512', this.paystackSecretKey)
   .update(JSON.stringify(payload))
   .digest('hex');

  if (hash !== signature) {
   throw new BadRequestException('Invalid webhook signature');
  }

  const { event, data } = payload;

  // Handle charge.success event
  if (event === 'charge.success') {
   const payment = await this.prisma.payment.findFirst({
    where: { transactionId: data.reference },
   });

   if (payment && payment.status !== PaymentStatus.COMPLETED) {
    await this.prisma.$transaction([
     // Update payment
     this.prisma.payment.update({
      where: { id: payment.id },
      data: {
       status: PaymentStatus.COMPLETED,
       paymentDetails: {
        ...data,
        webhook_received_at: new Date().toISOString(),
       },
      },
     }),
     // Update order
     this.prisma.order.update({
      where: { id: payment.orderId },
      data: {
       paymentStatus: PaymentStatus.COMPLETED,
       status: OrderStatus.PROCESSING,
      },
     }),
    ]);
   }
  }

  return { message: 'Webhook processed successfully' };
 }

 async getPaymentByOrder(userId: string, orderId: string, isAdmin: boolean = false) {
  const payment = await this.prisma.payment.findUnique({
   where: { orderId },
   include: {
    order: {
     include: {
      user: {
       select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
       },
      },
     },
    },
   },
  });

  if (!payment) {
   throw new NotFoundException('Payment not found');
  }

  // Verify access
  if (!isAdmin && payment.order.userId !== userId) {
   throw new ForbiddenException('Access denied');
  }

  return payment;
 }

 async getAllPayments(page: number = 1, limit: number = 10) {
  const skip = (page - 1) * limit;

  const total = await this.prisma.payment.count();

  const payments = await this.prisma.payment.findMany({
   skip,
   take: limit,
   orderBy: { createdAt: 'desc' },
   include: {
    order: {
     include: {
      user: {
       select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
       },
      },
     },
    },
   },
  });

  return {
   data: payments,
   meta: {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
   },
  };
 }

 async getPaymentStats() {
  const [
   totalPayments,
   completedPayments,
   pendingPayments,
   failedPayments,
  ] = await Promise.all([
   this.prisma.payment.count(),
   this.prisma.payment.count({ where: { status: PaymentStatus.COMPLETED } }),
   this.prisma.payment.count({ where: { status: PaymentStatus.PENDING } }),
   this.prisma.payment.count({ where: { status: PaymentStatus.FAILED } }),
  ]);

  const totalRevenue = await this.prisma.payment.aggregate({
   where: { status: PaymentStatus.COMPLETED },
   _sum: { amount: true },
  });

  return {
   totalPayments,
   completedPayments,
   pendingPayments,
   failedPayments,
   totalRevenue: totalRevenue._sum.amount || 0,
  };
 }

}
