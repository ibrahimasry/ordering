import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags, ApiResponse, ApiOperation } from '@nestjs/swagger';
import { OrderCreationService } from './order-creation.service';
import { CreateOrderDto } from './dto/create-order.dto';

@ApiTags('Order Creation')
@Controller('order')
export class OrderCreationController {
  constructor(private readonly orderCreationService: OrderCreationService) {}

  @Post('')
  @ApiOperation({ summary: 'Create a new order' })
  @ApiResponse({
    status: 201,
    description: 'The order has been successfully created.',
    schema: {
      example: {
        id: '1',
        merchantId: 'merchant123',
        status: 'PENDING',
        totalPrice: '99.99',
        currency: 'USD',
        orderItems: [
          {
            id: 'item1',
            productId: 'product123',
            quantity: 2,
            price: '49.99',
          },
        ],
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid input.' })
  async create(@Body() createOrderDto: CreateOrderDto) {
    return this.orderCreationService.create(createOrderDto);
  }

  @Post('seed')
  @ApiOperation({ summary: 'Seed initial data for testing orders' })
  @ApiResponse({
    status: 200,
    description: 'Initial data has been successfully seeded.',
  })
  @ApiResponse({ status: 500, description: 'Server error.' })
  async seed() {
    return this.orderCreationService.seed();
  }
}
