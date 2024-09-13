import { Controller} from '@nestjs/common';
import { OrderProcessingService } from './order-processing.service';
import { EventPattern } from '@nestjs/microservices';

@Controller()
export class OrderProcessingController {
  constructor(private OrderProcessingService: OrderProcessingService) {}
  @EventPattern('order-created')
  updateStock(event:{id:number}){
    this.OrderProcessingService.updateStock(event.id)
  }

  }
  