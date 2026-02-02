import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: Transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('MAIL_HOST'),
      port: Number(this.configService.get<number>('MAIL_PORT')),
      secure: false,
      auth: {
        user: this.configService.get<string>('MAIL_USER'),
        pass: this.configService.get<string>('MAIL_PASSWORD'),
      },
      connectionTimeout: 30000, // 10 seconds
      greetingTimeout: 30000,
      socketTimeout: 30000,
    });
  }

  async sendEmailVerification(email: string, token: string, firstName: string) {

    if (!this.transporter) {
      console.log('📧 [DEV MODE] Email Verification');
      console.log('To:', email);
      console.log('Token:', token);
      console.log('Verification URL:', `${this.configService.get<string>('FRONTEND_URL')}/verify-email?token=${token}`);
      return;
    }

    const verificationUrl = `${this.configService.get<string>('FRONTEND_URL')}/verify-email?token=${token}`;

    const mailOptions = {
      from: this.configService.get<string>('MAIL_FROM'),
      to: email,
      subject: 'Verify Your Email - Ariestobells',
      html: this.getEmailVerificationTemplate(firstName, verificationUrl),
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`✅ Verification email sent to ${email}`);
    } catch (error) {
      console.error('❌ Error sending verification email:', error);
      // Log but don't throw - allow registration to continue
      console.log('📧 [FALLBACK] Verification Token:', token);
    }
  }

  async sendPasswordResetEmail(email: string, token: string, firstName: string) {

    if (!this.transporter) {
      console.log('📧 [DEV MODE] Password Reset');
      console.log('To:', email);
      console.log('Token:', token);
      console.log('Reset URL:', `${this.configService.get<string>('FRONTEND_URL')}/reset-password?token=${token}`);
      return;
    }

    const resetUrl = `${this.configService.get<string>('FRONTEND_URL')}/reset-password?token=${token}`;

    const mailOptions = {
      from: this.configService.get<string>('MAIL_FROM'),
      to: email,
      subject: 'Reset Your Password - Ariestobells',
      html: this.getPasswordResetTemplate(firstName, resetUrl),
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`✅ Password reset email sent to ${email}`);
    } catch (error) {
      console.error('❌ Error sending password reset email:', error);
      console.log('📧 [FALLBACK] Reset Token:', token);
      // throw error;
    }
  }

  async sendWelcomeEmail(email: string, firstName: string) {
    if (!this.transporter) {
      console.log('📧 [DEV MODE] Welcome Email to:', email);
      return;
    }
    const mailOptions = {
      from: this.configService.get<string>('MAIL_FROM'),
      to: email,
      subject: 'Welcome to Ariestobells!',
      html: this.getWelcomeTemplate(firstName),
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`✅ Welcome email sent to ${email}`);
    } catch (error) {
      console.error('❌ Error sending welcome email:', error);
    }
  }

  async sendOrderConfirmation(email: string, firstName: string, orderNumber: string, orderTotal: number) {

    if (!this.transporter) {
      console.log('📧 [DEV MODE] Order Confirmation');
      console.log('To:', email);
      console.log('Order:', orderNumber);
      console.log('Total:', orderTotal);
      return;
    }

    const mailOptions = {
      from: this.configService.get<string>('MAIL_FROM'),
      to: email,
      subject: `Order Confirmation - ${orderNumber}`,
      html: this.getOrderConfirmationTemplate(firstName, orderNumber, orderTotal),
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`✅ Order confirmation email sent to ${email}`);
    } catch (error) {
      console.error('❌ Error sending order confirmation email:', error);
    }
  }

  private getEmailVerificationTemplate(firstName: string, verificationUrl: string): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #8B4513; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9f9f9; }
            .button { display: inline-block; padding: 12px 30px; background-color: #8B4513; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Ariestobells</h1>
              <p>Handmade Shoes</p>
            </div>
            <div class="content">
              <h2>Hi ${firstName},</h2>
              <p>Thank you for registering with Ariestobells! We're excited to have you join our community of handmade shoe enthusiasts.</p>
              <p>Please verify your email address by clicking the button below:</p>
              <div style="text-align: center;">
                <a href="${verificationUrl}" class="button">Verify Email Address</a>
              </div>
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #8B4513;">${verificationUrl}</p>
              <p><strong>This link will expire in 24 hours.</strong></p>
              <p>If you didn't create an account with us, please ignore this email.</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} Ariestobells. All rights reserved.</p>
              <p>Handcrafted with love in Nigeria 🇳🇬</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  private getPasswordResetTemplate(firstName: string, resetUrl: string): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #8B4513; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9f9f9; }
            .button { display: inline-block; padding: 12px 30px; background-color: #8B4513; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .warning { background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 10px; margin: 15px 0; }
            .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Ariestobells</h1>
              <p>Password Reset Request</p>
            </div>
            <div class="content">
              <h2>Hi ${firstName},</h2>
              <p>We received a request to reset your password for your Ariestobells account.</p>
              <p>Click the button below to reset your password:</p>
              <div style="text-align: center;">
                <a href="${resetUrl}" class="button">Reset Password</a>
              </div>
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #8B4513;">${resetUrl}</p>
              <div class="warning">
                <strong>⚠️ Security Notice:</strong>
                <p>This password reset link will expire in 1 hour.</p>
                <p>If you didn't request a password reset, please ignore this email or contact support if you have concerns.</p>
              </div>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} Ariestobells. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  private getWelcomeTemplate(firstName: string): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #8B4513; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9f9f9; }
            .button { display: inline-block; padding: 12px 30px; background-color: #8B4513; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Welcome to Ariestobells!</h1>
            </div>
            <div class="content">
              <h2>Hi ${firstName},</h2>
              <p>Your email has been verified successfully! Welcome to the Ariestobells family.</p>
              <p>We're thrilled to have you join our community of handmade shoe lovers. Get ready to step into style with our premium, handcrafted footwear.</p>
              <h3>What's Next?</h3>
              <ul>
                <li>Browse our collection of handmade shoes</li>
                <li>Add your favorite items to your cart</li>
                <li>Enjoy fast and secure checkout</li>
                <li>Track your orders in real-time</li>
              </ul>
              <div style="text-align: center;">
                <a href="${this.configService.get<string>('FRONTEND_URL')}/products" class="button">Start Shopping</a>
              </div>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} Ariestobells. All rights reserved.</p>
              <p>Handcrafted with love in Nigeria 🇳🇬</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  private getOrderConfirmationTemplate(firstName: string, orderNumber: string, orderTotal: number): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #8B4513; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9f9f9; }
            .order-box { background-color: white; border: 2px solid #8B4513; padding: 15px; margin: 20px 0; border-radius: 5px; }
            .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Order Confirmed!</h1>
            </div>
            <div class="content">
              <h2>Hi ${firstName},</h2>
              <p>Thank you for your order! We've received your purchase and are preparing it for shipment.</p>
              <div class="order-box">
                <h3>Order Details</h3>
                <p><strong>Order Number:</strong> ${orderNumber}</p>
                <p><strong>Total Amount:</strong> ₦${orderTotal.toLocaleString()}</p>
              </div>
              <p>We'll send you another email with tracking information once your order ships.</p>
              <p>You can view your order details anytime in your account dashboard.</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} Ariestobells. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }
}