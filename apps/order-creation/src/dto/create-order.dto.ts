import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsPositive,
  IsArray,
  ValidateNested,
} from 'class-validator';

export class CreateOrderItemDto {
  @IsInt()
  @IsPositive()
  @IsNotEmpty()
  productId: number;

  @IsInt()
  @IsPositive()
  @IsNotEmpty()
  quantity: number;
}

export class CreateOrderDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  @IsNotEmpty()
  products: CreateOrderItemDto[];
}
