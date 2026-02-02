import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { QueryProductDto } from './dto/querry-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
 constructor(private prisma: PrismaService) { }

 async create(createProductDto: CreateProductDto) {
  const { name, description, price, categoryId, variants, imageUrls, isFeatured } = createProductDto;

  // checking if category exists
  const category = await this.prisma.category.findUnique({
   where: { id: categoryId }
  });

  if (!category) {
   throw new NotFoundException('Category not found');
  }

  const slug = this.generateSlug(name);

  // checking if slug already exists
  const existingProduct = await this.prisma.product.findUnique({
   where: { slug }
  });
  if (existingProduct) {
   throw new ConflictException('Product with the same name already exists');
  }

  // checking for duplicate skus in variants
  const skus = variants.map(variant => variant.sku);
  const uniqueSkus = new Set(skus);
  if (skus.length !== uniqueSkus.size) {
   throw new BadRequestException('Duplicate SKUs found in product variants');
  }

  const existingVariants = await this.prisma.productVariant.findMany({
   where: { sku: { in: skus } },
  });

  if (existingVariants.length > 0) {
   throw new ConflictException(`SKU already exists: ${existingVariants[0].sku}`);
  }

  // createing product with variants and images
  const product = await this.prisma.product.create({
   data: {
    name,
    slug,
    description,
    price,
    categoryId,
    isFeatured: isFeatured || false,
    variants: {
     create: variants
    },
    images: imageUrls ? {
     create: imageUrls.map((url, index) => ({
      imageUrl: url,
      isPrimary: index === 0,
      order: index,
     }))
    } : undefined,
   },
   include: {
    variants: true,
    images: true,
   }
  });
 }

 async findAll(queryDto: QueryProductDto) {
  const { search, categoryId, minPrice, maxPrice, isFeatured, page, limit, sortBy, sortOrder } = queryDto;

  const skip = ((page || 1) - 1) * (limit || 10);
  const take = limit || 10;
  const where: any = {
   isActive: true,
  }
  if (search) {
   where.OR = [
    { name: { contains: search, mode: 'insensitive' } },
    { description: { contains: search, mode: 'insensitive' } },
   ]
  }

  if (categoryId) {
   where.categoryId = categoryId;
  }

  // Price range filter
  if (minPrice !== undefined || maxPrice !== undefined) {
   where.price = {};
   if (minPrice !== undefined) where.price.gte = minPrice;
   if (maxPrice !== undefined) where.price.lte = maxPrice;
  }

  // Featured filter
  if (isFeatured !== undefined) {
   where.isFeatured = isFeatured;
  }

  // Get total count
  const total = await this.prisma.product.count({ where });

  // Get products
  const products = await this.prisma.product.findMany({
   where,
   skip,
   take: limit,
   orderBy: { [sortBy as string]: sortOrder },
   include: {
    category: true,
    images: {
     orderBy: { order: 'asc' },
    },
    variants: true,
    _count: {
     select: { reviews: true },
    },
   },
  });

  // Calccilate average ratings
  const productsWithRatings = await Promise.all(
   products.map(async (products) => {
    const reviews = await this.prisma.review.findMany({
     where: { productId: products.id },
     select: { rating: true },
    });
    const averageRating = reviews.length
     ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
     : 0;
    return {
     ...products,
     averageRating: Math.round(averageRating * 10) / 10,
     reviewCount: reviews.length,
    }
   })
  );
  return {
   data: productsWithRatings,
   meta: {
    total,
    page: page || 1,
    limit: limit || 10,
    totalPages: Math.ceil(total / (limit || 10)),
   }
  }
 }


 async findOne(id: string) {
  const product = await this.prisma.product.findUnique({
   where: { id },
   include: {
    category: true,
    images: {
     orderBy: { order: 'asc' },
    },
    variants: true,
    reviews: {
     include: {
      user: {
       select: {
        id: true,
        firstName: true,
        lastName: true,
       },
      },
     },
     orderBy: { createdAt: 'desc' },
    },
   },
  });

  if (!product) {
   throw new NotFoundException('Product not found');
  }

  // Calculate average rating
  const avgRating = product.reviews.length > 0
   ? product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length
   : 0;

  return {
   ...product,
   averageRating: Math.round(avgRating * 10) / 10,
   reviewCount: product.reviews.length,
  };
 }

 async findBySlug(slug: string) {
  const product = await this.prisma.product.findUnique({
   where: { slug },
   include: {
    category: true,
    images: {
     orderBy: { order: 'asc' },
    },
    variants: true,
    reviews: {
     include: {
      user: {
       select: {
        id: true,
        firstName: true,
        lastName: true,
       },
      },
     },
     orderBy: { createdAt: 'desc' },
    },
   },
  });

  if (!product) {
   throw new NotFoundException('Product not found');
  }

  // Calculate average rating
  const avgRating = product.reviews.length > 0
   ? product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length
   : 0;

  return {
   ...product,
   averageRating: Math.round(avgRating * 10) / 10,
   reviewCount: product.reviews.length,
  };
 }


 async update(id: string, updateProductDto: UpdateProductDto) {
  await this.findOne(id); // Check if exists

  const { name, variants, imageUrls, ...rest } = updateProductDto;

  const data: any = { ...rest };

  // If name is being updated, regenerate slug
  if (name) {
   data.name = name;
   data.slug = this.generateSlug(name);

   // Check for conflicts
   const existingProduct = await this.prisma.product.findFirst({
    where: {
     AND: [
      { id: { not: id } },
      { slug: data.slug },
     ],
    },
   });

   if (existingProduct) {
    throw new ConflictException('Product with this name already exists');
   }
  }

  // Note: Variants and images update would be handled separately
  // This is a basic update for product info only

  return this.prisma.product.update({
   where: { id },
   data,
   include: {
    category: true,
    variants: true,
    images: true,
   },
  });
 }

 async remove(id: string) {
  await this.findOne(id); // Check if exists

  // Soft delete by setting isActive to false
  return this.prisma.product.update({
   where: { id },
   data: { isActive: false },
  });
 }

 async getFeaturedProducts(limit: number = 8) {
  return this.prisma.product.findMany({
   where: {
    isActive: true,
    isFeatured: true,
   },
   take: limit,
   include: {
    category: true,
    images: {
     where: { isPrimary: true },
     take: 1,
    },
    variants: {
     take: 1,
    },
   },
   orderBy: { createdAt: 'desc' },
  });
 }

 private generateSlug(name: string): string {
  return name
   .toLowerCase()
   .replace(/[^a-z0-9]+/g, '-')
   .replace(/^-+|-+$/g, '');
 }

}
