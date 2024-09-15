import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { ProductIngredient } from './product-ingrediant.entity';

@Entity()
export class Ingredient {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ type: 'float', default: 0 })
  initialStock: number;

  @Column({ type: 'float', default: 0 })
  stock: number;

  @OneToMany(
    () => ProductIngredient,
    (productIngredient) => productIngredient.ingredient,
  )
  productIngredients: ProductIngredient[];

  @UpdateDateColumn({ type: 'timestamptz' })
  lastUpdated: Date;
}
