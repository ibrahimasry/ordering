import { ClientKafka } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import * as Dinero from 'dinero.js';
import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import {
  KAFKA_CLIENT,
  ORDER_CREATED_EVENT,
} from '@app/common/constants/constants';
import { faker } from '@faker-js/faker';
import { Connection, In, Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import {
  Ingredient,
  Order,
  OrderCreatedEvent,
  OrderItem,
  OrderStatus,
  Product,
  ProductIngredient,
} from '@app/common';

@Injectable()
export class OrderCreationService {
  constructor(
    @Inject(KAFKA_CLIENT)
    private readonly serverClient: ClientKafka,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Ingredient)
    private readonly ingredientRepository: Repository<Ingredient>,
    @InjectRepository(ProductIngredient)
    private readonly productIngredientsRepository: Repository<ProductIngredient>,
    private configService: ConfigService,
    private connection: Connection,
  ) {}

  async create(createOrderDto: CreateOrderDto) {
    const queryRunner = this.connection.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const currency = this.configService.get('CURRENCY') || 'US';
      const order = new Order();
      order.currency = currency; // should be able to get by user Id from token for example
      let totalAmount = 0;

      const products = await queryRunner.manager.find(Product, {
        where: {
          id: In(
            createOrderDto.products.map(
              (productOrder) => productOrder.productId,
            ),
          ),
        },
        select: ['id', 'price'],
      });

      if (!products || products.length !== createOrderDto.products.length)
        throw new BadRequestException(`Some Products not found`);

      const productsMap = products.reduce((map, product) => {
        map.set(product.id, product);
        return map;
      }, new Map<number, Product>());

      for (const productOrder of createOrderDto.products) {
        const orderItem = new OrderItem();
        const product = productsMap.get(productOrder.productId);
        if (!product)
          throw new BadRequestException(
            `Product with ID ${productOrder.productId} not found`,
          );

        orderItem.product = product;
        orderItem.quantity = productOrder.quantity;

        totalAmount +=
          Dinero({
            amount: product.price * productOrder.quantity * 100,
            currency,
          }).getAmount() / 100;
        orderItem.productId = product.id;

        order.orderItems = order.orderItems || [];
        order.orderItems.push(orderItem);
      }

      order.totalPrice = totalAmount;
      order.status = OrderStatus.CREATED;

      const savedOrderItems = await queryRunner.manager.save(
        OrderItem,
        order.orderItems,
      );
      order.orderItems = savedOrderItems;

      const createdOrder = await queryRunner.manager.save(Order, order);

      await queryRunner.commitTransaction();
      this.serverClient.emit(
        ORDER_CREATED_EVENT,
        new OrderCreatedEvent(createdOrder.id),
      );

      return createdOrder;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error('Error creating order:', error);
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException(error.message);
    } finally {
      await queryRunner.release();
    }
  }
  async seed() {
    const ingredients = this.generateFakeIngredients(100);

    await this.ingredientRepository.save(ingredients);

    const product = this.productRepository.create({
      name: faker.commerce.productName(),
      price: parseFloat(faker.commerce.price()),
    });
    await this.productRepository.save(product);

    const productIngredients = this.generateProductIngredients(
      product,
      ingredients,
    );

    await this.productIngredientsRepository.save(productIngredients);
  }

  private generateFakeIngredients(count: number): Ingredient[] {
    return Array.from({ length: count }).map(() => {
      return this.ingredientRepository.create({
        name: faker.commerce.productMaterial(),
        initialStock: faker.number.int({ min: 500, max: 2000 }),
        stock: faker.number.int({ min: 50, max: 200 }),
      });
    });
  }

  private generateProductIngredients(
    product: Product,
    ingredients: Ingredient[],
  ): ProductIngredient[] {
    return ingredients.map((ingredient) => {
      return this.productIngredientsRepository.create({
        product,
        ingredient,
        quantity: parseFloat(faker.commerce.price({ min: 0.1, max: 1.0 })),
      });
    });
  }
}
