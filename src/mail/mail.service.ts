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
      host: 'smtp.gmail.com',
      port: 465,
      secure: true, // استخدم true للمنفذ 465 فقط
      auth: {
        user: this.configService.get<string>('EMAIL_USER'),
        pass: this.configService.get<string>('EMAIL_PASS'),
      },
      connectionTimeout: 10000, // 10 ثوانٍ كحد أقصى للاتصال
      greetingTimeout: 10000,
    });
  }

  async sendOTP(email: string, otp: string) {
    console.log(`📧 Attempting to send OTP to ${email}...`);
    try {
      await this.transporter.sendMail({
        from: `"ToDo Manager" <${this.configService.get('EMAIL_USER')}>`,
        to: email,
        subject: 'Your OTP Code',
        html: `<div style="text-align: right;"><h3>Your OTP Code:</h3><h1>${otp}</h1></div>`
      });
      console.log('✅ Email sent successfully!');
    } catch (error) {
      console.error('❌ MailService Error:', error);
      throw error;
    }
  }
}
