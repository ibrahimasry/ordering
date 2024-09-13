import { Module } from '@nestjs/common';
import { OrderCreationController } from './order-creation.controller';
import { OrderCreationService } from './order-creation.service';
import { DatabaseModule } from '@app/common';
import { Product } from '@app/common/models/product.entity';
import { Order } from '@app/common/models/order.entity';
import { OrderItem } from '@app/common/models/order-item.entity';
import { Ingredient } from '@app/common/models/ingredient.entity';
import { ClientKafka, ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule } from '@nestjs/config';
import { Merchant } from '@app/common/models/merchant.entity';
import { ProductIngredient } from '@app/common/models/product-ingrediant.entity';

@Module({
  imports: [
    DatabaseModule,
    DatabaseModule.forFeature([
      Order,
      OrderItem,
      Product,
      Ingredient,
      ProductIngredient,
      Merchant,
    ]),
    ConfigModule.forRoot({
      isGlobal: true, // Makes ConfigService available globally
    }),

    ClientsModule.register([
      {
        transport: Transport.KAFKA,
        name: 'KAFKA_CLIENT',
        options: {
          client: {
            clientId: 'billing',

            brokers: ['kafka:9092'],
          },
        },
      },
    ]),
  ],
  controllers: [OrderCreationController],
  providers: [OrderCreationService, ClientKafka],
})
export class OrderCreationModule {}
