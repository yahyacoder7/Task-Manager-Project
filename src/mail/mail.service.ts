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
      service: 'gmail',
      auth: {
        user: this.configService.get<string>('EMAIL_USER'),
        pass: this.configService.get<string>('EMAIL_PASS'),
      },
    });
  }
  async sendOTP(email: string, otp: string) {
    await this.transporter.sendMail({
      from: `"ToDo Manager" <${this.configService.get('EMAIL_USER')}>`,
      to: email,
      subject: 'Your OTP Code',
      html: `<div style="text-align: right;"><h3>Your OTP Code:</h3><h1>${otp}</h1></div>`
    });
  }
}
