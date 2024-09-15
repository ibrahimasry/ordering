import { Controller } from '@nestjs/common';
import { OrderProcessingService } from './order-processing.service';
import { EventPattern } from '@nestjs/microservices';
import { ORDER_CREATED_EVENT } from '@app/common/constants/constants';

@Controller()
export class OrderProcessingController {
  constructor(private OrderProcessingService: OrderProcessingService) {}
  @EventPattern(ORDER_CREATED_EVENT)
  updateStock(event: { id: number }) {
    this.OrderProcessingService.updateStock(event.id);
  }
}
