import { Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn, ManyToMany, OneToMany } from 'typeorm';
import { Product } from './product.entity';
import { ProductIngredient } from './product-ingrediant.entity';

@Entity()
export class Ingredient {


  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  // The initial stock, for example, 20kg
  @Column({ type: 'float',default:1000 })
  initialStock: number;

  // The current stock level, which will be updated when an order is placed
  @Column({ type: 'float' ,default:1000})
  stock: number;

  @OneToMany(() => ProductIngredient, productIngredient => productIngredient.ingredient)
  productIngredients: ProductIngredient[];  // Link to ProductIngredient entity


  @UpdateDateColumn({ type: 'timestamptz' }) // Use timestamptz for UTC
  lastUpdated: Date;


}
