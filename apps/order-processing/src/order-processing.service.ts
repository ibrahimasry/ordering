import { Controller, Get, Inject } from '@nestjs/common';
import { ClientKafka, EventPattern, MessagePattern } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { Merchant } from '@app/common/models/merchant.entity';
import { Ingredient } from '@app/common/models/ingredient.entity';
import { Product } from '@app/common/models/product.entity';
import { OrderItem } from '@app/common/models/order-item.entity';
import { Connection, Repository } from 'typeorm';
import { Order, OrderStatus } from '@app/common/models/order.entity';

@Controller()
export class OrderProcessingService {
  constructor(  
  @InjectRepository(Order)
  private readonly orderRepository: Repository<Order>,
  @InjectRepository(Merchant)
  private readonly merchantRepository: Repository<Merchant>,
  @Inject('KAFKA_CLIENT')
  private readonly serverClient: ClientKafka,
  private readonly connection: Connection, 


) {}

    async updateStock(orderId: number): Promise<void> {
      const queryRunner = this.connection.createQueryRunner();
  
      await queryRunner.startTransaction();
      let order:Order;
      this.serverClient.emit("Notify", new IngredientEvent({id:4, email:'ibrahim.elmansoury@gmail.com'})).subscribe(console.log)

      try {
        // Fetch the order with related data and acquire a pessimistic write lock on ingredients
         order = await queryRunner.manager.findOne(Order, {
          where :{id:orderId},
          relations: [
            'orderItems',
            'orderItems.product',
            'orderItems.product.productIngredients',
            'orderItems.product.productIngredients.ingredient'
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
            const lockedIngredient = await queryRunner.manager.findOne(Ingredient,  { 
              where:{id:ingredient.id},
              lock: { mode: 'pessimistic_write' } });
  
            if (!lockedIngredient) {
              throw new Error(`Ingredient with ID ${ingredient.id} not found`);
            }
  
            // Deduct the quantity from the ingredient's stock
            if(lockedIngredient.stock < quantityDeducted)
              throw new Error(`Ingredient with ID ${ingredient.id} isn't enough`);

            lockedIngredient.stock -= quantityDeducted;
            this.serverClient.emit("Notify", new IngredientEvent({id:productIngredient.id, email:'ibrahim.elmansoury@gmail.com'}));

            console.log(`Alert: Ingredient ${lockedIngredient.id} stock is below threshold`);

            // Check if stock falls below 50% and prepare alert if necessary
            const ingredientThreshold = lockedIngredient.initialStock * 0.5;
            if (true || lockedIngredient.stock < ingredientThreshold) {
              this.serverClient.emit("Notify", new IngredientEvent({id:productIngredient.id, email:'ibrahim.elmansoury@gmail.com'}));

              console.log(`Alert: Ingredient ${lockedIngredient.id} stock is below threshold`);
            }
  
            await queryRunner.manager.save(Ingredient, lockedIngredient);
            order.status = OrderStatus.COMPLETED
            await queryRunner.manager.save(Order,order);

          }
        }
  
        // Commit the transaction if everything is successful
        await queryRunner.commitTransaction();
      } catch (error) {
        // Rollback the transaction if any error occurs
        await queryRunner.rollbackTransaction();
        order.status = OrderStatus.FAILED
        this.orderRepository.save(order)

        console.error(`Failed to update stock for order ID ${orderId}:`, error);
        throw error; 
      } finally {
        await queryRunner.release();
      }
    }
  

  }


  class IngredientEvent {
    private id:number;
    private email:string;
    constructor({ id, email }) {
      this.id = id;
      this.email = email;
    }
  
    toString() {
      return JSON.stringify({
        id:this.id, 
        email:this.email 
      });
    }
  }
  