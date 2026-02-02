import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

import { Role } from '@prisma/client';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { QueryOrderDto } from './dto/query-order-dto';
import { CurrentUser } from 'src/common/decorators/current-user.decprator';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

@ApiTags('Orders')
@Controller('orders')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) { }

  @Post()
  @ApiOperation({ summary: 'Create order from cart' })
  @ApiResponse({ status: 201, description: 'Order created successfully' })
  @ApiResponse({ status: 400, description: 'Cart is empty or insufficient stock' })
  @ApiResponse({ status: 404, description: 'Address not found' })
  create(@CurrentUser() user: any, @Body() createOrderDto: CreateOrderDto) {
    return this.ordersService.createOrder(user.id, createOrderDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get user orders' })
  @ApiResponse({ status: 200, description: 'Orders retrieved successfully' })
  findAll(@CurrentUser() user: any, @Query() queryDto: QueryOrderDto) {
    return this.ordersService.findAll(user.id, queryDto, false);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get user order statistics' })
  @ApiResponse({ status: 200, description: 'Order stats retrieved successfully' })
  getStats(@CurrentUser() user: any) {
    return this.ordersService.getOrderStats(user.id);
  }

  @Get('admin/all')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get all orders (Admin only)' })
  @ApiResponse({ status: 200, description: 'All orders retrieved successfully' })
  findAllAdmin(@CurrentUser() user: any, @Query() queryDto: QueryOrderDto) {
    return this.ordersService.findAll(user.id, queryDto, true);
  }

  @Get('admin/stats')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get all order statistics (Admin only)' })
  @ApiResponse({ status: 200, description: 'Order stats retrieved successfully' })
  getAdminStats() {
    return this.ordersService.getOrderStats();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order by ID' })
  @ApiResponse({ status: 200, description: 'Order retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  findOne(@CurrentUser() user: any, @Param('id') id: string) {
    const isAdmin = user.role === Role.ADMIN;
    return this.ordersService.findOne(user.id, id, isAdmin);
  }

  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update order status (Admin only)' })
  @ApiResponse({ status: 200, description: 'Order status updated successfully' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  updateStatus(
    @Param('id') id: string,
    @Body() updateOrderStatusDto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateStatus(id, updateOrderStatusDto);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel order' })
  @ApiResponse({ status: 200, description: 'Order cancelled successfully' })
  @ApiResponse({ status: 400, description: 'Order cannot be cancelled' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  cancelOrder(@CurrentUser() user: any, @Param('id') id: string) {
    return this.ordersService.cancelOrder(user.id, id);
  }
}