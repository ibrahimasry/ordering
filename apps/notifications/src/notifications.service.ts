import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class NotificationsService {
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: this.configService.get('SMTP_USER'),
        clientId: this.configService.get('GOOGLE_OAUTH_CLIENT_ID'),
        clientSecret: this.configService.get('GOOGLE_OAUTH_CLIENT_SECRET'),
        refreshToken: this.configService.get('GOOGLE_OAUTH_REFRESH_TOKEN'),
      },
    });
  }
  async sendEmail(to: string, subject: string, text: string, html?: string) {
    const mailOptions = {
      from: this.configService.getOrThrow('MERCHANT_EMAIL'),
      to,
      subject,
      text,
      html,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log(`Message sent: ${info.response}`);
      return { sent: true };
    } catch (error) {
      console.error(`Error sending email: ${error}`);
      return { sent: false };
    }
  }
}
