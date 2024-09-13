import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToMany, JoinTable } from 'typeorm';
import { OrderItem } from './order-item.entity';
import { Ingredient } from './ingredient.entity';
import { ProductIngredient } from './product-ingrediant.entity';

@Entity()
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @OneToMany(() => OrderItem, (orderItem) => orderItem.product)
  orderItems: OrderItem[];


  @OneToMany(() => ProductIngredient, productIngredient => productIngredient.product, { cascade: true })
  productIngredients: ProductIngredient[];  // Link to ProductIngredient entity

}
