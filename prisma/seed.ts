import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
 console.log(' Starting seed...');

 // Create Admin User
 const hashedPassword = await bcrypt.hash('Admin123!', 10);

 const admin = await prisma.user.upsert({
  where: { email: 'admin@ariestobells.com' },
  update: {},
  create: {
   email: 'admin@ariestobells.com',
   password: hashedPassword,
   firstName: 'Admin',
   lastName: 'User',
   phone: '+2348012345678',
   role: Role.ADMIN,
  },
 });

 // Create cart for admin
 await prisma.cart.upsert({
  where: { userId: admin.id },
  update: {},
  create: {
   userId: admin.id,
  },
 });

 console.log('✅ Admin user created:', admin.email);

 // Create Categories
 const categories = [
  {
   name: 'Formal Shoes',
   slug: 'formal-shoes',
   description: 'Premium handmade formal shoes for special occasions',
  },
  {
   name: 'Casual Shoes',
   slug: 'casual-shoes',
   description: 'Comfortable everyday handmade shoes',
  },
  {
   name: 'Boots',
   slug: 'boots',
   description: 'Durable handcrafted boots',
  },
  {
   name: 'Loafers',
   slug: 'loafers',
   description: 'Elegant slip-on loafers',
  },
 ];

 for (const category of categories) {
  await prisma.category.upsert({
   where: { slug: category.slug },
   update: {},
   create: category,
  });
 }

 console.log('✅ Categories created');

 console.log('🎉 Seed completed!');
 console.log('');
 console.log('Admin credentials:');
 console.log('Email: admin@ariestobells.com');
 console.log('Password: Admin123!');
}

main()
 .catch((e) => {
  console.error(e);
  process.exit(1);
 })
 .finally(async () => {
  await prisma.$disconnect();
 });