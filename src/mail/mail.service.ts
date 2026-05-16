import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
    private readonly transporter: nodemailer.Transporter
  constructor(
    private readonly configService: ConfigService,
  ) {
    this.transporter = nodemailer.createTransport({
      host: 'smtp.resend.com',
      port: 465,
      secure: true,
      auth: {
        user: 'resend', // ثابتة دائماً مع Resend
        pass: this.configService.get<string>('EMAIL_PASS'), // ضع الـ API Key في هذا المتغير في Render
      },
    });
  }

  async sendOTP(email: string, otp: string) {
    console.log(`📧 Attempting to send OTP to ${email} via Resend...`);
    try {
      await this.transporter.sendMail({
        from: 'onboarding@resend.dev', // في النسخة المجانية يجب أن تستخدم هذا الإيميل أو دومين موثق
        to: email,
        subject: 'Your OTP Code',
        html: `<div style="text-align: right;"><h3>Your OTP Code:</h3><h1>${otp}</h1></div>`
      });
      console.log('✅ Email sent successfully via Resend!');
    } catch (error) {
      console.error('❌ MailService Error:', error);
      throw error;
    }
  }
}
