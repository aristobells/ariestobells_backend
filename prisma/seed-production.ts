import { PrismaClient, Role, Category } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
 console.log('🌱 Starting production seed...');

 // ========================================
 // 1. CREATE ADMIN USER
 // ========================================
 const existingAdmin = await prisma.user.findUnique({
  where: { email: 'admin@ariestobells.com' },
 });

 let admin;
 if (existingAdmin) {
  console.log('⏭️  Admin already exists');
  admin = existingAdmin;
 } else {
  console.log('Creating admin user...');
  const hashedPassword = await bcrypt.hash('Admin123!', 10);

  admin = await prisma.user.create({
   data: {
    email: 'admin@ariestobells.com',
    password: hashedPassword,
    firstName: 'Admin',
    lastName: 'User',
    phone: '+2348012345678',
    role: Role.ADMIN,
    isEmailVerified: true,
   },
  });

  await prisma.cart.create({
   data: { userId: admin.id },
  });

  console.log('✅ Admin user created:', admin.email);
 }

 // ========================================
 // 2. CREATE SAMPLE CUSTOMER (Optional)
 // ========================================
 const existingCustomer = await prisma.user.findUnique({
  where: { email: 'customer@example.com' },
 });

 if (!existingCustomer) {
  console.log('Creating sample customer...');
  const hashedPassword = await bcrypt.hash('Customer123!', 10);

  const customer = await prisma.user.create({
   data: {
    email: 'customer@example.com',
    password: hashedPassword,
    firstName: 'John',
    lastName: 'Doe',
    phone: '+2348087654321',
    role: Role.CUSTOMER,
    isEmailVerified: true,
   },
  });

  await prisma.cart.create({
   data: { userId: customer.id },
  });

  console.log('✅ Sample customer created:', customer.email);
 }

 // ========================================
 // 3. CREATE CATEGORIES
 // ========================================
 console.log('Creating categories...');
 const categories = [
  {
   name: 'Formal Shoes',
   slug: 'formal-shoes',
   description: 'Premium handmade formal shoes for special occasions',
   imageUrl: 'https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?w=500',
  },
  {
   name: 'Casual Shoes',
   slug: 'casual-shoes',
   description: 'Comfortable everyday handmade shoes',
   imageUrl: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=500',
  },
  {
   name: 'Boots',
   slug: 'boots',
   description: 'Durable handcrafted boots',
   imageUrl: 'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=500',
  },
  {
   name: 'Loafers',
   slug: 'loafers',
   description: 'Elegant slip-on loafers',
   imageUrl: 'https://images.unsplash.com/photo-1533867617858-e7b97e060509?w=500',
  },
  {
   name: 'Sneakers',
   slug: 'sneakers',
   description: 'Stylish handmade sneakers',
   imageUrl: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=500',
  },
 ];

 const createdCategories: Category[] = [];
 for (const category of categories) {
  const cat = await prisma.category.upsert({
   where: { slug: category.slug },
   update: {},
   create: category,
  });
  createdCategories.push(cat);
 }

 console.log('✅ Categories created');

 // ========================================
 // 4. CREATE SAMPLE PRODUCTS
 // ========================================
 console.log('Creating sample products...');

 const products = [
  // Formal Shoes
  {
   name: 'Classic Oxford Brown',
   description: 'Handcrafted premium leather oxford shoes with comfortable rubber sole. Perfect for formal occasions and business meetings.',
   price: 35000,
   categorySlug: 'formal-shoes',
   isFeatured: true,
   imageUrls: [
    'https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?w=500',
    'https://images.unsplash.com/photo-1533867617858-e7b97e060509?w=500',
   ],
   variants: [
    { size: '40', color: 'Brown', sku: 'ARB-OXF-BRN-40', stock: 10 },
    { size: '41', color: 'Brown', sku: 'ARB-OXF-BRN-41', stock: 8 },
    { size: '42', color: 'Brown', sku: 'ARB-OXF-BRN-42', stock: 12 },
    { size: '43', color: 'Brown', sku: 'ARB-OXF-BRN-43', stock: 7 },
    { size: '44', color: 'Brown', sku: 'ARB-OXF-BRN-44', stock: 5 },
   ],
  },
  {
   name: 'Derby Black Leather',
   description: 'Elegant black derby shoes made from genuine Italian leather. Ideal for weddings and formal events.',
   price: 42000,
   categorySlug: 'formal-shoes',
   isFeatured: true,
   imageUrls: [
    'https://images.unsplash.com/photo-1533867617858-e7b97e060509?w=500',
   ],
   variants: [
    { size: '40', color: 'Black', sku: 'ARB-DRB-BLK-40', stock: 6 },
    { size: '41', color: 'Black', sku: 'ARB-DRB-BLK-41', stock: 9 },
    { size: '42', color: 'Black', sku: 'ARB-DRB-BLK-42', stock: 11 },
    { size: '43', color: 'Black', sku: 'ARB-DRB-BLK-43', stock: 8 },
   ],
  },

  // Casual Shoes
  {
   name: 'Suede Casual Sneakers',
   description: 'Comfortable suede sneakers perfect for everyday wear. Lightweight and breathable design.',
   price: 28000,
   categorySlug: 'casual-shoes',
   isFeatured: true,
   imageUrls: [
    'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=500',
   ],
   variants: [
    { size: '39', color: 'Navy', sku: 'ARB-SUD-NVY-39', stock: 15 },
    { size: '40', color: 'Navy', sku: 'ARB-SUD-NVY-40', stock: 12 },
    { size: '41', color: 'Navy', sku: 'ARB-SUD-NVY-41', stock: 10 },
    { size: '42', color: 'Navy', sku: 'ARB-SUD-NVY-42', stock: 14 },
   ],
  },
  {
   name: 'Canvas Slip-Ons',
   description: 'Easy slip-on canvas shoes for casual outings. Perfect for weekend adventures.',
   price: 22000,
   categorySlug: 'casual-shoes',
   isFeatured: false,
   imageUrls: [
    'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=500',
   ],
   variants: [
    { size: '40', color: 'Beige', sku: 'ARB-CNV-BGE-40', stock: 20 },
    { size: '41', color: 'Beige', sku: 'ARB-CNV-BGE-41', stock: 18 },
    { size: '42', color: 'Beige', sku: 'ARB-CNV-BGE-42', stock: 16 },
   ],
  },

  // Boots
  {
   name: 'Chelsea Ankle Boots',
   description: 'Classic Chelsea boots with elastic side panels. Crafted from premium leather for durability.',
   price: 48000,
   categorySlug: 'boots',
   isFeatured: true,
   imageUrls: [
    'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=500',
   ],
   variants: [
    { size: '40', color: 'Brown', sku: 'ARB-CHL-BRN-40', stock: 8 },
    { size: '41', color: 'Brown', sku: 'ARB-CHL-BRN-41', stock: 10 },
    { size: '42', color: 'Brown', sku: 'ARB-CHL-BRN-42', stock: 7 },
    { size: '43', color: 'Brown', sku: 'ARB-CHL-BRN-43', stock: 6 },
   ],
  },

  // Loafers
  {
   name: 'Penny Loafers',
   description: 'Timeless penny loafers with hand-stitched details. Perfect blend of comfort and style.',
   price: 38000,
   categorySlug: 'loafers',
   isFeatured: true,
   imageUrls: [
    'https://images.unsplash.com/photo-1533867617858-e7b97e060509?w=500',
   ],
   variants: [
    { size: '40', color: 'Tan', sku: 'ARB-PNY-TAN-40', stock: 12 },
    { size: '41', color: 'Tan', sku: 'ARB-PNY-TAN-41', stock: 14 },
    { size: '42', color: 'Tan', sku: 'ARB-PNY-TAN-42', stock: 10 },
    { size: '43', color: 'Tan', sku: 'ARB-PNY-TAN-43', stock: 9 },
   ],
  },

  // Sneakers
  {
   name: 'Leather High-Top Sneakers',
   description: 'Modern high-top sneakers made from genuine leather. Street style meets premium craftsmanship.',
   price: 32000,
   categorySlug: 'sneakers',
   isFeatured: true,
   imageUrls: [
    'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=500',
   ],
   variants: [
    { size: '39', color: 'White', sku: 'ARB-HTS-WHT-39', stock: 15 },
    { size: '40', color: 'White', sku: 'ARB-HTS-WHT-40', stock: 13 },
    { size: '41', color: 'White', sku: 'ARB-HTS-WHT-41', stock: 18 },
    { size: '42', color: 'White', sku: 'ARB-HTS-WHT-42', stock: 16 },
    { size: '43', color: 'White', sku: 'ARB-HTS-WHT-43', stock: 11 },
   ],
  },
 ];

 for (const productData of products) {
  const category = createdCategories.find(cat => cat.slug === productData.categorySlug);

  if (!category) continue;

  const slug = productData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  const existingProduct = await prisma.product.findUnique({
   where: { slug },
  });

  if (existingProduct) {
   console.log(`⏭️  Product "${productData.name}" already exists`);
   continue;
  }

  await prisma.product.create({
   data: {
    name: productData.name,
    slug,
    description: productData.description,
    price: productData.price,
    categoryId: category.id,
    isFeatured: productData.isFeatured,
    variants: {
     create: productData.variants,
    },
    images: {
     create: productData.imageUrls.map((url, index) => ({
      imageUrl: url,
      isPrimary: index === 0,
      order: index,
     })),
    },
   },
  });

  console.log(`✅ Created product: ${productData.name}`);
 }

 console.log('');
 console.log('🎉 Production seed completed!');
 console.log('');
 console.log('='.repeat(50));
 console.log('📧 ADMIN CREDENTIALS:');
 console.log('='.repeat(50));
 console.log('Email: admin@ariestobells.com');
 console.log('Password: Admin123!');
 console.log('');
 console.log('📧 SAMPLE CUSTOMER CREDENTIALS:');
 console.log('='.repeat(50));
 console.log('Email: customer@example.com');
 console.log('Password: Customer123!');
 console.log('');
 console.log('📊 DATABASE SUMMARY:');
 console.log('='.repeat(50));
 console.log(`Categories: ${createdCategories.length}`);
 console.log(`Products: ${products.length}`);
 console.log('='.repeat(50));
}

main()
 .catch((e) => {
  console.error('❌ Seed error:', e);
  process.exit(1);
 })
 .finally(async () => {
  await prisma.$disconnect();
 });