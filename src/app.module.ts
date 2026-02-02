import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from './prisma.service';
import { AuthModule } from './modules/auth/auth.module';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { CategoriesModule } from './modules/categories/categories.module';
import { ProductsModule } from './modules/products/products.module';
import { CartModule } from './modules/cart/cart.module';
import { UsersModule } from './modules/users/users.module';
import { OrdersModule } from './modules/orders/orders.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { UploadModule } from './modules/upload/upload.module';
import { EmailModule } from './modules/email/email.module';



@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    CategoriesModule,
    ProductsModule,
    CartModule,
    UsersModule,
    OrdersModule,
    PaymentsModule,
    UploadModule,
    EmailModule,
  ],

  controllers: [AppController],
  providers: [AppService, PrismaService, {
    provide: APP_GUARD,
    useClass: JwtAuthGuard,
  },
    { provide: APP_GUARD, useClass: RolesGuard }],
  exports: [PrismaService]
})
export class AppModule { }
