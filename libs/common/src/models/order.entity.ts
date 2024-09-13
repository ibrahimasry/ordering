import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne, UpdateDateColumn } from 'typeorm';
import { OrderItem } from './order-item.entity';
import { Merchant } from './merchant.entity'; // Assume Merchant entity exists

export enum OrderStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CREATED = 'CREATED'
}

@Entity()
export class Order {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  merchantId: number;

  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.PENDING })
  status: OrderStatus;

  @Column('decimal', { precision: 10, scale: 2 ,nullable:true})
  totalPrice: number;

  @Column()
  currency: string; // Added currency field

  @OneToMany(() => OrderItem, (orderItem) => orderItem.order, { cascade: true })
  orderItems: OrderItem[];

  // @ManyToOne(() => Merchant, (merchant) => merchant.orders)
  // merchant: Merchant;

  @UpdateDateColumn({ type: 'timestamptz' }) // Use timestamptz for UTC
  lastUpdated: Date;
}
