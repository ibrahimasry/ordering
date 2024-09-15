import { Test, TestingModule } from '@nestjs/testing';
import { OrderCreationService } from './order-creation.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Connection, QueryRunner } from 'typeorm';
import { Order } from '@app/common/entities/order.entity';
import { OrderItem } from '@app/common/entities/order-item.entity';
import { Product } from '@app/common/entities/product.entity';
import { Ingredient } from '@app/common/entities/ingredient.entity';
import { ProductIngredient } from '@app/common/entities/product-ingrediant.entity';
import { ClientKafka, ClientsModule, Transport } from '@nestjs/microservices';
import {
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { ConnectionMock, OrderCreatedEvent } from '@app/common';
import {
  BROKERS,
  KAFKA_CLIENT,
  ORDER_CREATED_EVENT,
} from '@app/common/constants/constants';
import { ConfigModule } from '@nestjs/config';

describe('OrderCreationService', () => {
  let service: OrderCreationService;
  let kafkaClient: ClientKafka;
  let connection: ConnectionMock;
  let queryRunner;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
        }),
        ClientsModule.register([
          {
            transport: Transport.KAFKA,
            name: KAFKA_CLIENT,
            options: {
              client: {
                brokers: BROKERS,
              },
              consumer: {
                groupId: 'test-consumer-group',
              },
            },
          },
        ]),
      ],
      providers: [
        OrderCreationService,
        {
          provide: getRepositoryToken(Order),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(OrderItem),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Product),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Ingredient),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(ProductIngredient),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
          },
        },
        { provide: Connection, useClass: ConnectionMock },
        {
          provide: getRepositoryToken(Order),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(OrderItem),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
          },
        },
        { provide: Connection, useClass: ConnectionMock },
      ],
    })
      .overrideProvider(KAFKA_CLIENT)
      .useValue({
        emit: jest.fn(),
        connect: jest.fn(),
      })
      .compile();

    service = module.get<OrderCreationService>(OrderCreationService);

    kafkaClient = module.get<ClientKafka>('KAFKA_CLIENT');
    connection = module.get<Connection>(Connection);
    queryRunner =
      new ConnectionMock().createQueryRunner() as unknown as QueryRunner;

    jest.spyOn(connection, 'createQueryRunner').mockReturnValue(queryRunner);
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
    } as OrderItem;
    const orderItem2 = {
      product: product2,
      quantity: 1,
    } as OrderItem;
    queryRunner.manager.find = jest
      .fn()
      .mockResolvedValueOnce([product1, product2]);
    const order = {
      id: 1,
      totalPrice: 400,
      currency: 'US',
      orderItems: [orderItem1, orderItem2],
    } as Order;

    queryRunner.manager.save = jest
      .fn()
      .mockResolvedValueOnce([orderItem1, orderItem2])
      .mockResolvedValueOnce(order);

    const emitSpy = jest.spyOn(kafkaClient, 'emit');

    const result = await service.create(createOrderDto);

    expect(result).toHaveProperty('id', 1);
    expect(result.totalPrice).toBe(400);
    expect(result.currency).toBe('US');
    expect(result.orderItems.length).toBe(2);

    expect(emitSpy).toHaveBeenCalledWith(
      ORDER_CREATED_EVENT,
      new OrderCreatedEvent(1),
    );
  });

  it('should throw BadRequestException if a product is not found', async () => {
    const createOrderDto = {
      products: [{ productId: 999, quantity: 1 }],
    };
    queryRunner.manager.findOne = jest.fn().mockResolvedValueOnce(null);

    await expect(service.create(createOrderDto)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('should throw InternalServerErrorException if there is an error saving the order', async () => {
    const createOrderDto = {
      products: [{ productId: 1, quantity: 1 }],
    };

    const product = { id: 1, price: 100 } as Product;
    const orderItem1 = { product, quantity: 2 } as OrderItem;
    queryRunner.manager.find = jest
      .fn()
      .mockResolvedValueOnce([product])
      .mockResolvedValueOnce([orderItem1]);
    queryRunner.manager.save = jest
      .fn()
      .mockRejectedValueOnce(
        new InternalServerErrorException('data base error'),
      );

    await expect(service.create(createOrderDto)).rejects.toThrow(
      InternalServerErrorException,
    );
  });
});
