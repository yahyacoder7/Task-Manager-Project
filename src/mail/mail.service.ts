import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
  private apiKey: string;
  private fromEmail: string;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('BREVO_API_KEY') || '';
    this.fromEmail = this.configService.get<string>('EMAIL_FROM') || '';
    console.log(`📧 Mail configured with Brevo HTTP API (fromEmail: ${this.fromEmail})`);
  }

  async sendOTP(email: string, otp: string) {
    console.log(`📧 Attempting to send OTP to ${email} via Brevo HTTP API...`);

    try {
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'api-key': this.apiKey,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          sender: { name: 'Task Flow', email: this.fromEmail },
          to: [{ email }],
          subject: 'Your Verification Code (OTP)',
          htmlContent: `
            <div style="font-family: Arial, sans-serif; text-align: right; direction: rtl; padding: 20px;">
              <h2>مرحباً بك في Task Flow!</h2>
              <p>رمز التحقق الخاص بك هو:</p>
              <h1 style="color: #D84315; background: #f4f4f4; padding: 10px; display: inline-block; border-radius: 8px;">${otp}</h1>
              <p>الرجاء عدم مشاركة هذا الرمز مع أي شخص.</p>
            </div>
          `,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('❌ Brevo API Error:', JSON.stringify(data));
        throw new Error(data.message || 'Brevo API request failed');
      }

      console.log('✅ Email sent successfully via Brevo HTTP API!', data.messageId);
    } catch (error: any) {
      console.error('❌ MailService Error:', error.message);
      throw new InternalServerErrorException(
        `Failed to send email: ${error.message}`
      );
    }
  }
}
