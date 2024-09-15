import { NestFactory } from '@nestjs/core';
import { OrderCreationModule } from './order-creation.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(OrderCreationModule);

  const config = new DocumentBuilder()
    .setTitle(process.env.npm_package_name || 'create_order')
    .setVersion(process.env.npm_package_version || '1.0.0')
    .build();
  const document = SwaggerModule.createDocument(app, config, {
    operationIdFactory: (controllerKey: string, methodKey: string) => methodKey,
  });
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      displayRequestDuration: true,
    },
  });

  await app.listen(3001);
}
bootstrap();
