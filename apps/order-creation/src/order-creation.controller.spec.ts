import { Test, TestingModule } from '@nestjs/testing';
import { OrderCreationController } from './order-process.controller';
import { OrderCreationService } from './order-process.service';

describe('OrderCreationController', () => {
  let OrderCreationController: OrderCreationController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [OrderCreationController],
      providers: [OrderCreationService],
    }).compile();

    OrderCreationController = app.get<OrderCreationController>(OrderCreationController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(OrderCreationController.getHello()).toBe('Hello World!');
    });
  });
});
