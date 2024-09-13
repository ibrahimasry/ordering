import { NestFactory } from '@nestjs/core';
import { NotificationsModule } from './notifications.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    NotificationsModule,
    {
      transport: Transport.KAFKA,
      options: {
        client: {
          brokers: ['kafka:9092'],
          clientId:'notifications'
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
