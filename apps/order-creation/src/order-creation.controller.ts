import { Body, Controller, Post } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderCreationService } from './order-creation.service';

@Controller('order')
export class OrderCreationController {
  constructor(private readonly OrderCreationService: OrderCreationService) {}

  @Post('')
  async create(@Body() createOrderDto: CreateOrderDto) {
    return this.OrderCreationService.create(createOrderDto);
  }
}
