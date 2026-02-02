import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';


@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {

 async onModuleInit() {
  await this.$connect();
  console.log('✅ Database connected successfully');
 }

 async onModuleDestroy() {
  await this.$disconnect();
  console.log('👋 Database disconnected');
 }

 // Helper method to clear database (useful for testing)
 async cleanDatabase() {
  if (process.env.NODE_ENV === 'production') return;

  // Get all model names dynamically
  const modelKeys = Object.keys(this).filter(
   (key) => typeof this[key] === 'object' && this[key]?.deleteMany
  );

  return Promise.all(
   modelKeys.map((model) => this[model].deleteMany())
  );
 }
}
