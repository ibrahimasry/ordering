import { Module } from '@nestjs/common';
import { OrderProcessingController } from './order-processing.controller';
import { OrderProcessingService } from './order-processing.service';
import { ClientKafka, ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '@app/common';
import { Order } from '@app/common/entities/order.entity';
import { OrderItem } from '@app/common/entities/order-item.entity';
import { Product } from '@app/common/entities/product.entity';
import { Ingredient } from '@app/common/entities/ingredient.entity';
import { ProductIngredient } from '@app/common/entities/product-ingrediant.entity';
import {
  BROKERS,
  KAFKA_CLIENT,
  NOTIFICATION_CLIENT_ID,
} from '@app/common/constants/constants';

@Module({
  imports: [
    ClientsModule.register([
      {
        transport: Transport.KAFKA,
        name: KAFKA_CLIENT,
        options: {
          client: {
            clientId: NOTIFICATION_CLIENT_ID,

            brokers: BROKERS,
          },
          consumer: {
            groupId: 'email-notifications',
          },
        },
      },
    ]),

    DatabaseModule,
    DatabaseModule.forFeature([
      Order,
      OrderItem,
      Product,
      Ingredient,
      ProductIngredient,
    ]),

    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  controllers: [OrderProcessingController],
  providers: [OrderProcessingService, ClientKafka],
})
export class OrderProcessingModule {}
