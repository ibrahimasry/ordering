import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { OrderProcessingModule } from './order-processing.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    OrderProcessingModule,
    {
      transport: Transport.KAFKA,
      options: {
        client: {
          brokers: ['kafka:9092'],
          clientId:'process-order'
        },
        consumer: {
          groupId: 'order-processing',
        },

      },
    },
  );
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  app.listen()


}
bootstrap();
