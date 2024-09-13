import { Module } from '@nestjs/common';
import { OrderProcessingController } from './order-processing.controller';
import { OrderProcessingService } from './order-processing.service';
import { ClientKafka, ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '@app/common';
import { Order } from '@app/common/models/order.entity';
import { OrderItem } from '@app/common/models/order-item.entity';
import { Product } from '@app/common/models/product.entity';
import { Ingredient } from '@app/common/models/ingredient.entity';
import { Merchant } from '@app/common/models/merchant.entity';
import { ProductIngredient } from '@app/common/models/product-ingrediant.entity';

@Module({
  imports: [    
    ClientsModule.register([
      {
        transport: Transport.KAFKA,
        name: 'KAFKA_CLIENT',
        options: {
          client: {
            clientId: 'notifications',

            brokers: ['kafka:9092'],
          },
          consumer: {
            groupId: 'email-notifications',
          },
        },
      },
    ]),

    DatabaseModule,
    DatabaseModule.forFeature([Order,OrderItem,Product,Ingredient,Merchant,ProductIngredient]),

    ConfigModule.forRoot({
    isGlobal: true,
  }),
],
  controllers: [OrderProcessingController],
  providers: [OrderProcessingService,ClientKafka],
})
export class OrderProcessingModule {}
