import { BadRequestException, ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma.service';
import { RegisterDto } from './dto/Register.dto';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { EmailService } from '../email/email.service';
import { VerifyEmailDto } from './dto/verify-email.dto';
import * as crypto from 'crypto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
@Injectable()
export class AuthService {

 constructor(
  private prisma: PrismaService,
  private jwtService: JwtService,
  private emailService: EmailService,
 ) { }
 async register(registerDto: RegisterDto) {
  const { email, password, firstName, lastName, phone } = registerDto;
  // Check if user already exists
  const existingUser = await this.prisma.user.findUnique({
   where: { email }
  });
  if (existingUser) {
   throw new ConflictException('User with this email already exists');
  }
  // hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Generate email verification token
  const verificationToken = crypto.randomBytes(32).toString('hex');
  // create user
  const user = await this.prisma.user.create({
   data: {
    email,
    password: hashedPassword,
    firstName,
    lastName,
    phone,
    emailVerificationToken: verificationToken,

   },
   select: {
    id: true,
    email: true,
    firstName: true,
    lastName: true,
    phone: true,
    role: true
   }
  });

  // create a cart for the user
  await this.prisma.cart.create({
   data: {
    userId: user.id
   }
  });

  // Send verification email
  await this.emailService.sendEmailVerification(
   user.email,
   verificationToken,
   user.firstName,
  );

  // Generate JWT token
  const token = await this.generateToken(user.id, user.email, user.role)
  return {
   user,
   token,
   message: 'Registration successful'
  };
 }

 async login(loginDto: LoginDto) {
  const { email, password } = loginDto;
  const user = await this.prisma.user.findUnique({
   where: { email }
  });
  if (!user) {
   throw new UnauthorizedException('Invalid credentials');
  }
  const isPasswordValid = await bcrypt.compare(password, user.password)
  if (!isPasswordValid) {
   throw new UnauthorizedException('Invalid credentials');
  }

  const token = await this.generateToken(user.id, user.email, user.role);
  return {
   user: {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role
   },
   token,
   message: 'Login successful'
  }
 }

 async getProfile(userId: string) {
  const user = await this.prisma.user.findUnique({
   where: { id: userId },
   select: {
    id: true,
    email: true,
    firstName: true,
    lastName: true,
    phone: true,
    role: true,
    isActive: true,
    createdAt: true,
    updatedAt: true,
   }
  })

  if (!user) {
   throw new BadRequestException('User not found');
  }
  return user;
 }



 private async generateToken(userId: string, email: string, role: string) {
  const payload = { sub: userId, email, role };
  return this.jwtService.sign(payload);
 }

 async verifyEmail(verifyEmailDto: VerifyEmailDto) {
  const { token } = verifyEmailDto;

  const user = await this.prisma.user.findFirst({
   where: { emailVerificationToken: token },
  });

  if (!user) {
   throw new BadRequestException('Invalid or expired verification token');
  }

  // Update user as verified
  await this.prisma.user.update({
   where: { id: user.id },
   data: {
    isEmailVerified: true,
    emailVerificationToken: null,
   },
  });

  // Send welcome email
  await this.emailService.sendWelcomeEmail(user.email, user.firstName);

  return {
   message: 'Email verified successfully',
  };
 }

 async resendVerificationEmail(email: string) {
  const user = await this.prisma.user.findUnique({
   where: { email },
  });

  if (!user) {
   throw new NotFoundException('User not found');
  }

  if (user.isEmailVerified) {
   throw new BadRequestException('Email is already verified');
  }

  // Generate new verification token
  const verificationToken = crypto.randomBytes(32).toString('hex');

  await this.prisma.user.update({
   where: { id: user.id },
   data: { emailVerificationToken: verificationToken },
  });

  // Send verification email
  await this.emailService.sendEmailVerification(
   user.email,
   verificationToken,
   user.firstName,
  );

  return {
   message: 'Verification email sent successfully',
  };
 }

 async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
  const { email } = forgotPasswordDto;

  const user = await this.prisma.user.findUnique({
   where: { email },
  });

  if (!user) {
   // Don't reveal if user exists or not for security
   return {
    message: 'If an account exists with this email, a password reset link has been sent',
   };
  }

  // Generate reset token
  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetExpires = new Date(Date.now() + 3600000); // 1 hour from now

  await this.prisma.user.update({
   where: { id: user.id },
   data: {
    passwordResetToken: resetToken,
    passwordResetExpires: resetExpires,
   },
  });

  // Send password reset email
  await this.emailService.sendPasswordResetEmail(
   user.email,
   resetToken,
   user.firstName,
  );

  return {
   message: 'If an account exists with this email, a password reset link has been sent',
  };
 }


 async resetPassword(resetPasswordDto: ResetPasswordDto) {
  const { token, newPassword } = resetPasswordDto;

  const user = await this.prisma.user.findFirst({
   where: {
    passwordResetToken: token,
    passwordResetExpires: {
     gt: new Date(), // Token not expired
    },
   },
  });

  if (!user) {
   throw new BadRequestException('Invalid or expired reset token');
  }

  // Hash new password
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  // Update password and clear reset token
  await this.prisma.user.update({
   where: { id: user.id },
   data: {
    password: hashedPassword,
    passwordResetToken: null,
    passwordResetExpires: null,
   },
  });

  return {
   message: 'Password reset successfully',
  };
 }


}
