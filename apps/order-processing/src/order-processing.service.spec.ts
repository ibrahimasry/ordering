import { Test, TestingModule } from '@nestjs/testing';
import { Connection, QueryRunner } from 'typeorm';
import { OrderProcessingService } from './order-processing.service';
import { ConnectionMock, Order, OrderItem, OrderStatus } from '@app/common';
import { ConfigModule } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BROKERS, KAFKA_CLIENT } from '@app/common/constants/constants';
import { ClientsModule, Transport } from '@nestjs/microservices';

describe('OrderProcessingService', () => {
  let service: OrderProcessingService;
  let connection: Connection;
  let queryRunner: QueryRunner;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
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
        ConfigModule.forRoot({
          isGlobal: true,
        }),
      ],

      providers: [
        OrderProcessingService,
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
      ],
    })
      .overrideProvider(KAFKA_CLIENT)
      .useValue({
        emit: jest.fn(),
        connect: jest.fn(),
      })
      .compile();

    service = module.get<OrderProcessingService>(OrderProcessingService);
    connection = module.get<Connection>(Connection);
    queryRunner =
      new ConnectionMock().createQueryRunner() as unknown as QueryRunner;

    jest.spyOn(connection, 'createQueryRunner').mockReturnValue(queryRunner);
  });

  it('should update stock successfully', async () => {
    const orderId = 1;

    const productIngredientMock = {
      id: 1,
      quantity: 2,
      ingredient: null,
    };

    const ingredientMock = {
      id: 1,
      stock: 100,
      initialStock: 200,
      name: 'Sample Ingredient',
      productIngredients: [productIngredientMock],
      lastUpdated: new Date(),
    };

    const productMock = {
      id: 1,
      name: 'Sample Product',
      price: 100,
      productIngredients: [productIngredientMock],
      orderItems: [],
    };

    productIngredientMock.ingredient = ingredientMock;

    const order: any = new Order();
    order.id = orderId;
    order.orderItems = [
      {
        product: productMock,
        quantity: 3,
      },
    ];

    queryRunner.manager.findOne = jest
      .fn()
      .mockResolvedValueOnce(order)
      .mockResolvedValueOnce(ingredientMock);

    await service.updateStock(orderId);

    expect(queryRunner.manager.save).toHaveBeenCalledTimes(2);
    expect(queryRunner.manager.save).toHaveBeenCalledWith(
      Order,
      expect.objectContaining({ status: OrderStatus.COMPLETED }),
    );
    expect(queryRunner.commitTransaction).toHaveBeenCalled();
  });

  it('should throw an error if the order is not found', async () => {
    const orderId = 1;
    queryRunner.manager.findOne = jest.fn().mockResolvedValueOnce(null);

    await expect(service.updateStock(orderId)).rejects.toThrow(
      `Order with ID ${orderId} not found`,
    );
    expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
  });

  it('should throw an error if an ingredient is not found', async () => {
    const orderId = 1;
    const order = new Order();
    order.id = orderId;
    order.orderItems = [
      {
        product: {
          productIngredients: [
            {
              ingredient: { id: 1 },
              quantity: 2,
            },
          ],
        },
        quantity: 3,
      },
    ] as OrderItem[];
    queryRunner.manager.findOne = jest
      .fn()
      .mockResolvedValueOnce(order)
      .mockResolvedValueOnce(null);

    await expect(service.updateStock(orderId)).rejects.toThrow(
      `Ingredient with ID 1 not found`,
    );
    expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
  });

  it('should throw an error if the ingredient stock is insufficient', async () => {
    const orderId = 1;
    const order = new Order();
    order.id = orderId;
    order.orderItems = [
      {
        product: {
          productIngredients: [
            {
              ingredient: { id: 1, stock: 1, initialStock: 10 },
              quantity: 2,
            },
          ],
        },
        quantity: 3,
      },
    ] as OrderItem[];
    queryRunner.manager.findOne = jest
      .fn()
      .mockResolvedValueOnce(order)
      .mockResolvedValueOnce(
        order.orderItems[0].product.productIngredients[0].ingredient,
      );

    await expect(service.updateStock(orderId)).rejects.toThrow(
      `Ingredient with ID 1 isn't enough`,
    );
    expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
  });

  it('should send an alert if the ingredient stock falls below the threshold', async () => {
    const orderId = 1;
    const order = new Order();
    order.id = orderId;
    order.orderItems = [
      {
        product: {
          productIngredients: [
            {
              ingredient: { id: 1, stock: 49, initialStock: 100 },
              quantity: 2,
            },
          ],
        },
        quantity: 3,
      },
    ] as OrderItem[];
    queryRunner.manager.findOne = jest
      .fn()
      .mockResolvedValueOnce(order)
      .mockResolvedValueOnce(
        order.orderItems[0].product.productIngredients[0].ingredient,
      );
    const emitSpy = jest.spyOn(service['serverClient'], 'emit');

    await service.updateStock(orderId);

    expect(emitSpy).toHaveBeenCalled();
  });

  it('should rollback the transaction and set the order status to FAILED on error', async () => {
    const orderId = 1;
    const order = new Order();
    order.id = orderId;
    order.orderItems = [
      {
        product: {
          productIngredients: [
            {
              ingredient: { id: 1 },
              quantity: 2,
            },
          ],
        },
        quantity: 3,
      },
    ] as OrderItem[];
    queryRunner.manager.findOne = jest
      .fn()
      .mockResolvedValueOnce(order)
      .mockImplementation(() => {
        throw new Error('Test error');
      });

    await expect(service.updateStock(orderId)).rejects.toThrow('Test error');
    expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
  });
});
