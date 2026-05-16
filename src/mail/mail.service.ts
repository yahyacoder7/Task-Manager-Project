import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: this.configService.get<string>('EMAIL_USER'),
        pass: this.configService.get<string>('EMAIL_PASS'),
      },
    });
  }

  async sendOTP(email: string, otp: string) {
    console.log(`📧 Attempting to send OTP to ${email} via Gmail (Nodemailer)...`);

    try {
      const mailOptions = {
        from: `"Task Manager" <${this.configService.get<string>('EMAIL_USER')}>`,
        to: email,
        subject: 'رمز التحقق الخاص بك (OTP)',
        html: `
          <div style="font-family: Arial, sans-serif; text-align: right; direction: rtl; padding: 20px;">
            <h2>مرحباً بك!</h2>
            <p>رمز التحقق الخاص بك هو:</p>
            <h1 style="color: #D84315; background: #f4f4f4; padding: 10px; display: inline-block; border-radius: 8px;">${otp}</h1>
            <p>الرجاء عدم مشاركة هذا الرمز مع أي شخص.</p>
          </div>
        `,
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('✅ Email sent successfully via Gmail!', info.messageId);
    } catch (error: any) {
      console.error('❌ MailService Nodemailer Error:', error.message);
      throw new InternalServerErrorException('فشل في إرسال البريد الإلكتروني، تحقق من إعدادات Gmail');
    }
  }
}
