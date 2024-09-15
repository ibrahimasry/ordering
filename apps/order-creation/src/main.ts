import { NestFactory } from '@nestjs/core';
import { OrderCreationModule } from './order-creation.module';

async function bootstrap() {
  const app = await NestFactory.create(OrderCreationModule);
  await app.listen(3001);
}
bootstrap();
