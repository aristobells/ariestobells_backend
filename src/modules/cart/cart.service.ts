import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';


@Injectable()
export class CartService {
  constructor(private prisma: PrismaService) { }

  async getCart(userId: string) {

    let cart = await this.prisma.cart.findUnique({
      where: { userId: userId },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: {
                  where: { isPrimary: true },
                  take: 1
                },
                category: true
              }
            },
            variant: true
          }
        }
      }
    });

    if (!cart) {
      cart = await this.prisma.cart.create({
        data: { userId: userId },
        include: {
          items: {
            include: {
              product: {
                include: {
                  images: {
                    where: { isPrimary: true },
                    take: 1,
                  },
                  category: true
                },
              },
              variant: true,
            }
          }
        }
      });
    }
    // Calculate cart summary
    const summary = this.calculateCartSummary(cart);
    return { ...cart, summary }
  }

  async addToCart(userId: string, addToCartDto: AddToCartDto) {
    const { productId, variantId, quantity } = addToCartDto;

    const product = await this.prisma.product.findFirst({
      where: { id: productId, isActive: true }
    });
    if (!product) {
      throw new NotFoundException('Product not found or inactive');
    }

    const variant = await this.prisma.productVariant.findFirst({
      where: { id: variantId, productId: productId }
    })

    if (!variant) {
      throw new NotFoundException('Product variant not found');
    }

    if (variant.stock < quantity) {
      throw new BadRequestException(`Insufficient stock. Only ${variant.stock} items available`);
    }

    // Get or create cart
    let cart = await this.prisma.cart.findUnique({
      where: { userId: userId }
    });

    if (!cart) {
      cart = await this.prisma.cart.create({
        data: { userId },
      });
    }

    // confirm if item already in cart
    let existingItem = await this.prisma.cartItem.findUnique({
      where: {
        cartId_variantId: {
          cartId: cart.id,
          variantId: variantId
        }
      }
    });

    if (existingItem) {
      //update quantity
      const newQuantity = existingItem.quantity + quantity;
      if (variant.stock < newQuantity) {
        throw new BadRequestException(`Cannot add more items. Only ${variant.stock} items available`);
      }
      await this.prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + quantity }
      })
    } else {
      // Add new item
      await this.prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          variantId,
          quantity,
        },
      });
    }
    return this.getCart(userId);
  }


  async updateCartItem(
    userId: string,
    itemId: string,
    updateCartItemDto: UpdateCartItemDto
  ) {
    const { quantity } = updateCartItemDto;

    // Get cart item
    const cartItem = await this.prisma.cartItem.findFirst({
      where: {
        id: itemId,
        cart: { userId },
      },
      include: {
        variant: true,
      },
    });

    if (!cartItem) {
      throw new NotFoundException('Cart item not found');
    }

    // Check stock availability
    if (cartItem.variant.stock < quantity) {
      throw new BadRequestException(
        `Insufficient stock. Only ${cartItem.variant.stock} items available`,
      );
    }

    // Update quantity
    await this.prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity },
    });

    return this.getCart(userId);
  }


  async removeCartItem(userId: string, itemId: string) {
    // Verify item belongs to user's cart
    const cartItem = await this.prisma.cartItem.findFirst({
      where: {
        id: itemId,
        cart: { userId },
      },
    });

    if (!cartItem) {
      throw new NotFoundException('Cart item not found');
    }

    // Delete item
    await this.prisma.cartItem.delete({
      where: { id: itemId },
    });

    return this.getCart(userId);
  }

  async clearCart(userId: string) {
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
    });

    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    // Delete all cart items
    await this.prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    return this.getCart(userId);
  }

  async getCartItemCount(userId: string) {
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: {
        items: true,
      },
    });

    if (!cart) {
      return { count: 0 };
    }

    const count = cart.items.reduce((total, item) => total + item.quantity, 0);

    return { count };
  }

  private calculateCartSummary(cart: any) {
    let subtotal = 0;
    let totalItems = 0;

    for (const item of cart.items) {
      const itemPrice = item.variant.price
        ? Number(item.variant.price)
        : Number(item.product.price);

      subtotal += itemPrice * item.quantity;
      totalItems += item.quantity;
    }

    //shipping cost logic here
    const shippingCost = subtotal > 0 ? 3000 : 0; // ₦2000 flat shipping
    const tax = subtotal * 0.075; // 7.5% VAT
    const total = subtotal + shippingCost + tax;

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      shippingCost: Math.round(shippingCost * 100) / 100,
      tax: Math.round(tax * 100) / 100,
      total: Math.round(total * 100) / 100,
      totalItems,
      itemCount: cart.items.length,
    };
  }

}










