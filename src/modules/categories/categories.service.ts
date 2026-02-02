import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
 constructor(private prisma: PrismaService) { }

 async create(createCategoryDto: CreateCategoryDto) {
  const { name, description, imageUrl } = createCategoryDto;

  // generate slug from name
  const slug = this.generateSlug(name);

  const existingCategory = await this.prisma.category.findFirst({
   where: {
    OR: [{ name }, { slug }]
   }
  });

  if (existingCategory) {
   throw new ConflictException('Category with the same name or slug already exists');
  }

  return this.prisma.category.create({
   data: {
    name,
    slug,
    description,
    imageUrl
   }
  });

 }
 async findAll() {
  return this.prisma.category.findMany({
   where: { isActive: true },
   include: {
    _count: {
     select: { products: true },
    },
   },
   orderBy: { name: 'asc' }
  });
 }


 async findOne(id: string) {
  const category = await this.prisma.category.findUnique({
   where: { id },
   include: {
    products: {
     where: { isActive: true },
     include: {
      images: {
       where: { isPrimary: true },
       take: 1,
      },
     },
    },
   },
  });
  if (!category) {
   throw new NotFoundException('Category not found');
  }
  return category;
 }


 async findBySlug(slug: string) {
  const category = await this.prisma.category.findUnique({
   where: { slug },
   include: {
    products: {
     where: { isActive: true },
     include: {
      images: {
       where: { isPrimary: true },
       take: 1,
      },
     },
    },
   },
  });

  if (!category) {
   throw new NotFoundException('Category not found');
  }

  return category;
 }


 async update(id: string, updateCategoryDto: UpdateCategoryDto) {
  await this.findOne(id); // Check if exists

  const { name, ...rest } = updateCategoryDto;

  const data: any = { ...rest };

  // If name is being updated, regenerate slug
  if (name) {
   data.name = name;
   data.slug = this.generateSlug(name);

   // Check for conflicts
   const existingCategory = await this.prisma.category.findFirst({
    where: {
     AND: [
      { id: { not: id } },
      {
       OR: [{ name }, { slug: data.slug }],
      },
     ],
    },
   });

   if (existingCategory) {
    throw new ConflictException('Category with this name already exists');
   }
  }

  return this.prisma.category.update({
   where: { id },
   data,
  });
 }

 async remove(id: string) {
  await this.findOne(id); // Check if exists

  // Soft delete by setting isActive to false
  return this.prisma.category.update({
   where: { id },
   data: { isActive: false },
  });
 }


 private generateSlug(name: string): string {
  return name
   .toLowerCase()
   .replace(/[^a-z0-9]+/g, '-')
   .replace(/^-+|-+$/g, '');
 }
}
