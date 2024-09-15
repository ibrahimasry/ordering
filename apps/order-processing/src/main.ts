import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { OrderProcessingModule } from './order-processing.module';
import { ValidationPipe } from '@nestjs/common';
import {
  BROKERS,
  PROCESS_ORDER_CLIENT_ID,
} from '@app/common/constants/constants';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    OrderProcessingModule,
    {
      transport: Transport.KAFKA,
      options: {
        client: {
          brokers: BROKERS,
          clientId: PROCESS_ORDER_CLIENT_ID,
        },
        consumer: {
          groupId: 'order-processing',
        },
      },
    },
  );

  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  app.listen();
}
bootstrap();
