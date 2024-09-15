import { Controller } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { EventPattern } from '@nestjs/microservices';
import { NOTIFY_EVENT } from '@app/common/constants/constants';

@Controller()
export class NotificationsController {
  constructor(private notificationService: NotificationsService) {}

  @EventPattern(NOTIFY_EVENT)
  async sendEmail(event: { id: number; email: string }) {
    return this.notificationService.sendEmail(
      event.email,
      'low ingredient alert',
      `ingredient with id = ${event.id} is blow 50%`,
    );
  }
}
