import { Test, TestingModule } from '@nestjs/testing';
import {
  OrderCreatedEvent,
  OrderCreationService,
} from './order-creation.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '@app/common/models/order.entity';
import { OrderItem } from '@app/common/models/order-item.entity';
import { Product } from '@app/common/models/product.entity';
import { Ingredient } from '@app/common/models/ingredient.entity';
import { Merchant } from '@app/common/models/merchant.entity';
import { ProductIngredient } from '@app/common/models/product-ingrediant.entity';
import { ClientKafka } from '@nestjs/microservices';
import {
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';

describe('OrderCreationService', () => {
  let service: OrderCreationService;
  let orderRepository: Repository<Order>;
  let orderItemRepository: Repository<OrderItem>;
  let productRepository: Repository<Product>;
  let kafkaClient: ClientKafka;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderCreationService,
        {
          provide: getRepositoryToken(Order),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(OrderItem),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(Product),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(Ingredient),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(Merchant),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(ProductIngredient),
          useClass: Repository,
        },
        {
          provide: 'KAFKA_CLIENT',
          useValue: {
            emit: jest.fn().mockReturnValue({ subscribe: jest.fn() }),
          },
        },
      ],
    }).compile();

    service = module.get<OrderCreationService>(OrderCreationService);
    orderRepository = module.get<Repository<Order>>(getRepositoryToken(Order));
    orderItemRepository = module.get<Repository<OrderItem>>(
      getRepositoryToken(OrderItem),
    );
    productRepository = module.get<Repository<Product>>(
      getRepositoryToken(Product),
    );
    kafkaClient = module.get<ClientKafka>('KAFKA_CLIENT');
  });

  it('should successfully create an order', async () => {
    const createOrderDto: CreateOrderDto = {
      products: [
        { productId: 1, quantity: 2 },
        { productId: 2, quantity: 1 },
      ],
    };

    const product1 = { id: 1, price: 100 } as Product;
    const product2 = { id: 2, price: 200 } as Product;

    const orderItem1 = {
      product: product1,
      quantity: 2,
      price: 200,
    } as OrderItem;
    const orderItem2 = {
      product: product2,
      quantity: 1,
      price: 200,
    } as OrderItem;

    jest
      .spyOn(productRepository, 'findOne')
      .mockResolvedValueOnce(product1)
      .mockResolvedValueOnce(product2);

    jest
      .spyOn(orderItemRepository, 'save')
      .mockResolvedValueOnce(orderItem1)
      .mockResolvedValue(orderItem2);

    const order = {
      id: 1,
      merchantId: 1,
      totalPrice: 400,
      currency: 'us',
      orderItems: [orderItem1, orderItem2],
    } as Order;
    jest.spyOn(orderRepository, 'save').mockResolvedValue(order);

    const emitSpy = jest.spyOn(kafkaClient, 'emit');

    const result = await service.create(createOrderDto);

    expect(result).toHaveProperty('id', 1);
    expect(result.totalPrice).toBe(400);
    expect(result.currency).toBe('us');
    expect(result.orderItems.length).toBe(2);

    expect(emitSpy).toHaveBeenCalledWith(
      'order-created',
      new OrderCreatedEvent(1),
    );
  });

  it('should throw BadRequestException if a product is not found', async () => {
    const createOrderDto = {
      products: [{ productId: 999, quantity: 1 }],
    };

    jest.spyOn(productRepository, 'findOne').mockResolvedValueOnce(null);

    await expect(service.create(createOrderDto)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('should throw InternalServerErrorException if there is an error saving the order', async () => {
    const createOrderDto = {
      products: [{ productId: 1, quantity: 1 }],
    };

    const product = { id: 1, price: 100 } as Product;
    const orderItem1 = { product, quantity: 2, price: 200 } as OrderItem;

    jest.spyOn(productRepository, 'findOne').mockResolvedValueOnce(product);
    jest.spyOn(orderItemRepository, 'save').mockResolvedValue(orderItem1);
    jest
      .spyOn(orderRepository, 'save')
      .mockRejectedValue(new Error('Database error'));

    await expect(service.create(createOrderDto)).rejects.toThrow(
      InternalServerErrorException,
    );
  });
});
