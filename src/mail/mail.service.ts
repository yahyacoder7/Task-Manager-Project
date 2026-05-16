import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true, // استخدام SSL
      auth: {
        user: this.configService.get<string>('EMAIL_USER'),
        pass: this.configService.get<string>('EMAIL_PASS'),
      },
      // هذا الخيار مهم جداً لحل مشكلة ENETUNREACH في Render
      // فهو يجبر النودميلر على استخدام IPv4 بدلاً من IPv6
      // @ts-ignore
      family: 4, 
    });
  }

  async sendOTP(email: string, otp: string) {
    console.log(`📧 Attempting to send OTP to ${email} via Gmail SMTP (IPv4)...`);

    try {
      const mailOptions = {
        from: `"Task Flow" <${this.configService.get<string>('EMAIL_USER')}>`,
        to: email,
        subject: 'رمز التحقق الخاص بك (OTP)',
        html: `
          <div style="font-family: Arial, sans-serif; text-align: right; direction: rtl; padding: 20px;">
            <h2>مرحباً بك في Task Flow!</h2>
            <p>رمز التحقق الخاص بك هو:</p>
            <h1 style="color: #D84315; background: #f4f4f4; padding: 10px; display: inline-block; border-radius: 8px;">${otp}</h1>
            <p>الرجاء عدم مشاركة هذا الرمز مع أي شخص.</p>
          </div>
        `,
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('✅ Email sent successfully via Gmail SMTP!', info.messageId);
    } catch (error: any) {
      console.error('❌ MailService SMTP Error:', error.message);
      
      // إذا استمر الخطأ، فمن المحتمل أن تكون المشكلة في App Password أو حظر من طرف Render
      throw new InternalServerErrorException(
        `فشل في إرسال البريد الإلكتروني: ${error.message}`
      );
    }
  }
}
