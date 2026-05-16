import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
  constructor(private readonly configService: ConfigService) {}

  async sendOTP(email: string, otp: string) {
    const apiKey = this.configService.get<string>('EMAIL_PASS');
    console.log(`📧 Attempting to send OTP to ${email} via Resend API (HTTP)...`);

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          from: 'onboarding@resend.dev',
          to: email,
          subject: 'Your OTP Code',
          html: `<div style="text-align: right;"><h3>Your OTP Code:</h3><h1>${otp}</h1></div>`,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('❌ Resend API Error:', data);
        throw new Error(data.message || 'Failed to send email');
      }

      console.log('✅ Email sent successfully via Resend API!', data.id);
    } catch (error: any) {
      console.error('❌ MailService HTTP Error:', error.message);
      throw error;
    }
  }
}
