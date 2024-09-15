import { Controller, Inject } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { Ingredient } from '@app/common/entities/ingredient.entity';
import { Connection, Repository } from 'typeorm';
import { Order, OrderStatus } from '@app/common/entities/order.entity';
import { ConfigService } from '@nestjs/config';
import { KAFKA_CLIENT, NOTIFY_EVENT } from '@app/common/constants/constants';
import { IngredientEvent } from '@app/common';

@Controller()
export class OrderProcessingService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    private readonly configService: ConfigService,
    @Inject(KAFKA_CLIENT)
    private readonly serverClient: ClientKafka,
    private readonly connection: Connection,
  ) {}

  async updateStock(orderId: number): Promise<void> {
    const queryRunner = this.connection.createQueryRunner();

    await queryRunner.startTransaction();
    let order: Order;

    try {
      order = await queryRunner.manager.findOne(Order, {
        where: { id: orderId },
        relations: [
          'orderItems',
          'orderItems.product',
          'orderItems.product.productIngredients',
          'orderItems.product.productIngredients.ingredient',
        ],
      });

      if (!order) {
        throw new Error(`Order with ID ${orderId} not found`);
      }
      for (const item of order.orderItems) {
        for (const productIngredient of item.product.productIngredients) {
          const ingredient = productIngredient.ingredient;
          const quantityDeducted = productIngredient.quantity * item.quantity;

          // Acquire a pessimistic write lock on the ingredient
          const lockedIngredient = await queryRunner.manager.findOne(
            Ingredient,
            {
              where: { id: ingredient.id },
              lock: { mode: 'pessimistic_write' },
            },
          );
          if (!lockedIngredient) {
            throw new Error(`Ingredient with ID ${ingredient.id} not found`);
          }

          if (lockedIngredient.stock < quantityDeducted)
            throw new Error(`Ingredient with ID ${ingredient.id} isn't enough`);

          // Check if stock falls below 50% and prepare alert if necessary
          const ingredientThreshold = lockedIngredient.initialStock * 0.5;
          if (lockedIngredient.stock < ingredientThreshold) {
            this.serverClient.emit(
              NOTIFY_EVENT,
              new IngredientEvent({
                id: productIngredient.id,
                email:
                  this.configService.get('MERCHANT_EMAIL') ||
                  'ecample@gamilc.om',
              }),
            );

            console.log(
              `Alert: Ingredient ${lockedIngredient.id} stock is below threshold`,
            );
          }
          // Deduct the quantity from the ingredient's stock

          lockedIngredient.stock -= quantityDeducted;

          await queryRunner.manager.save(Ingredient, lockedIngredient);
          order.status = OrderStatus.COMPLETED;
          await queryRunner.manager.save(Order, order);
        }
      }

      await queryRunner.commitTransaction();
    } catch (error) {
      if (queryRunner) await queryRunner.rollbackTransaction();
      if (order) {
        order.status = OrderStatus.FAILED;
        await this.orderRepository.save(order);
      }
      console.error(`Failed to update stock for order ID ${orderId}:`, error);
      throw error;
    } finally {
      if (queryRunner) await queryRunner.release();
    }
  }
}
