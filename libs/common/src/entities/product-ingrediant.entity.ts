import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Product } from './product.entity';
import { Ingredient } from './ingredient.entity';

@Entity()
export class ProductIngredient {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Product, (product) => product.productIngredients)
  product: Product;

  @ManyToOne(() => Ingredient, (ingredient) => ingredient.productIngredients)
  ingredient: Ingredient;

  @Column({ type: 'float' })
  quantity: number;
}
