import { Module } from '@nestjs/common';
import { OrderCreationController } from './order-creation.controller';
import { OrderCreationService } from './order-creation.service';
import { DatabaseModule } from '@app/common';
import { Product } from '@app/common/entities/product.entity';
import { Order } from '@app/common/entities/order.entity';
import { OrderItem } from '@app/common/entities/order-item.entity';
import { Ingredient } from '@app/common/entities/ingredient.entity';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule } from '@nestjs/config';
import { ProductIngredient } from '@app/common/entities/product-ingrediant.entity';
import {
  BROKERS,
  KAFKA_CLIENT,
  PROCESS_ORDER_CLIENT_ID,
} from '@app/common/constants/constants';

@Module({
  imports: [
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

    ClientsModule.register([
      {
        transport: Transport.KAFKA,
        name: KAFKA_CLIENT,
        options: {
          client: {
            clientId: PROCESS_ORDER_CLIENT_ID,

            brokers: BROKERS,
          },
        },
      },
    ]),
  ],
  controllers: [OrderCreationController],
  providers: [OrderCreationService],
})
export class OrderCreationModule {}
