import { ClientKafka } from '@nestjs/microservices';
import { Order, OrderStatus } from '@app/common/models/order.entity';
import { Merchant } from '@app/common/models/merchant.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { OrderItem } from '@app/common/models/order-item.entity';
import { Product } from '@app/common/models/product.entity';
import { Ingredient } from '@app/common/models/ingredient.entity';
import { Repository, RepositoryNotTreeError } from 'typeorm';
import * as  Dinero from 'dinero.js';
import { ProductIngredient } from '@app/common/models/product-ingrediant.entity';
import { BadRequestException, Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class OrderCreationService {
  constructor(
    @Inject('KAFKA_CLIENT')
    private readonly serverClient: ClientKafka,
  
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Ingredient)
    private readonly ingredientRepository: Repository<Ingredient>,
    @InjectRepository(Merchant)
    private readonly merchantRepository: Repository<Merchant>,
    @InjectRepository(ProductIngredient)
    private productIngredientRepository: Repository<ProductIngredient>,
  ) {}

  async create(createOrderDto: CreateOrderDto) {
    const currency = 'us'; // Consider using a configuration value or enum for currencies

    const order = new Order();
    order.merchantId = 1; // Consider making merchantId dynamic or configurable
    order.status = OrderStatus.PENDING;
    order.currency = currency;

    await this.orderRepository.save(order);

    let totalAmount = 0;

    // Fetch products in parallel to reduce DB query time
    const productPromises = createOrderDto.products.map(productOrder =>
      this.productRepository.findOne({ where: { id: productOrder.productId } })
    );

    try {
      const products = await Promise.all(productPromises);

      // Process each product
      for (const [index, productOrder] of createOrderDto.products.entries()) {
        const product = products[index];

        if (!product) {
          throw new BadRequestException(`Product with ID ${productOrder.productId} not found`);
        }

        const orderItem = new OrderItem();
        orderItem.product = product;
        orderItem.quantity = productOrder.quantity;

        // Use Dinero for currency and amount calculations
        orderItem.price = Dinero({ amount: product.price * productOrder.quantity * 100, currency }).getAmount() / 100;
        orderItem.currency = currency;
        orderItem.productId = product.id;
        totalAmount += orderItem.price;

        order.orderItems = order.orderItems || [];
        order.orderItems.push(orderItem);
      }

      order.totalPrice = totalAmount;

      const savedOrderItems = await this.orderItemRepository.save(order.orderItems);
      order.orderItems = savedOrderItems;
      order.status = OrderStatus.CREATED
      const createdOrder = await this.orderRepository.save(order);

       
      // Emit the order-created event
      this.serverClient.emit('order-created', new OrderCreatedEvent(createdOrder.id)).subscribe(console.log)

      return createdOrder; 
    } catch (error) {
      console.error('Error creating order:', error);
      throw new InternalServerErrorException('Failed to create order');
    }
  }
}
export class OrderCreatedEvent {
  constructor(private id:number
  ) {}

  toString() {
    return JSON.stringify({
      id: this.id,
    });
  }
}