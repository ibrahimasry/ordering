import { NestFactory } from '@nestjs/core';
import { NotificationsModule } from './notifications.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ValidationPipe } from '@nestjs/common';
import {
  BROKERS,
  NOTIFICATION_CLIENT_ID,
} from '@app/common/constants/constants';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    NotificationsModule,
    {
      transport: Transport.KAFKA,
      options: {
        client: {
          brokers: BROKERS,
          clientId: NOTIFICATION_CLIENT_ID,
        },
        consumer: {
          groupId: 'email-notifications',
        },
      },
    },
  );
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  await app.listen();
}
bootstrap();
