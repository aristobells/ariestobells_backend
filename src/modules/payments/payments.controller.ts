import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Headers,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiHeader } from '@nestjs/swagger';

import { Role } from '@prisma/client';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decprator';
import { InitializePaymentDto } from './dto/initialize-payment.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';
import { Public } from 'src/common/decorators/public.decorator';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) { }

  @Post('initialize')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Initialize payment for an order' })
  @ApiResponse({ status: 201, description: 'Payment initialized successfully' })
  @ApiResponse({ status: 400, description: 'Order already paid or cancelled' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  initializePayment(
    @CurrentUser() user: any,
    @Body() initializePaymentDto: InitializePaymentDto,
  ) {
    return this.paymentsService.initializePayment(user.id, initializePaymentDto);
  }

  @Post('verify')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify payment transaction' })
  @ApiResponse({ status: 200, description: 'Payment verified successfully' })
  @ApiResponse({ status: 400, description: 'Payment verification failed' })
  @ApiResponse({ status: 404, description: 'Payment record not found' })
  verifyPayment(
    @CurrentUser() user: any,
    @Body() verifyPaymentDto: VerifyPaymentDto,
  ) {
    return this.paymentsService.verifyPayment(user.id, verifyPaymentDto);
  }

  @Public()
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Handle Paystack webhook' })
  @ApiHeader({ name: 'x-paystack-signature', required: true })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid webhook signature' })
  handleWebhook(
    @Headers('x-paystack-signature') signature: string,
    @Body() payload: any,
  ) {
    return this.paymentsService.handleWebhook(payload, signature);
  }

  @Get('order/:orderId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get payment details for an order' })
  @ApiResponse({ status: 200, description: 'Payment retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  getPaymentByOrder(@CurrentUser() user: any, @Param('orderId') orderId: string) {
    const isAdmin = user.role === Role.ADMIN;
    return this.paymentsService.getPaymentByOrder(user.id, orderId, isAdmin);
  }

  @Get('admin/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all payments (Admin only)' })
  @ApiResponse({ status: 200, description: 'Payments retrieved successfully' })
  getAllPayments(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.paymentsService.getAllPayments(page, limit);
  }

  @Get('admin/stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get payment statistics (Admin only)' })
  @ApiResponse({ status: 200, description: 'Payment stats retrieved successfully' })
  getPaymentStats() {
    return this.paymentsService.getPaymentStats();
  }
}