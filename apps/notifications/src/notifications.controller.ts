import { Controller, Get, Inject } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { EventPattern } from '@nestjs/microservices';

@Controller()
export class NotificationsController {
  constructor(private notificationService: NotificationsService) {}

  @EventPattern('Notify')
  async sendEmail(event: { id: number; email: string }) {
    return this.notificationService.sendEmail(
      event.email,
      'low ingredient alert',
      `ingredient with id = ${event.id} is blow 50%`,
    );
  }
}
