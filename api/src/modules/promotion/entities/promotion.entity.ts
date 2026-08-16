import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinTable,
  ManyToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { MenuItem } from '@modules/menu/entities/menu-item.entity';

export type DiscountType = 'percentage' | 'fixed';

/**
 * A marketing promotion: a landing page at `/promotion/{slug}` plus an optional
 * discount (percentage or fixed) applied at checkout, gated by an optional code,
 * a validity window, and global / per-customer usage limits.
 */
@Entity('promotions')
export class Promotion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @Column({ type: 'varchar' })
  title: string;

  @Index({ unique: true })
  @Column({ type: 'varchar' })
  slug: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'varchar', nullable: true })
  imageUrl: string | null;

  @Column({ type: 'varchar', default: 'percentage' })
  discountType: DiscountType;

  /** Percent (e.g. 30) when `percentage`, or an amount (e.g. 5.00) when `fixed`. */
  @Column({ type: 'double precision', default: 0 })
  discountValue: number;

  /** Null = auto-applies (no code needed). Set = customer must enter this code. */
  @Column({ type: 'varchar', nullable: true })
  code: string | null;

  /** Minimum cart subtotal required for the promo to apply. */
  @Column({ type: 'double precision', default: 0 })
  minOrderAmount: number;

  /** Optional cap on the discount amount (mainly for percentage promos). */
  @Column({ type: 'double precision', nullable: true })
  maxDiscountAmount: number | null;

  @Column({ type: 'timestamptz', nullable: true })
  startsAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  endsAt: Date | null;

  @Column({ type: 'boolean', default: true })
  active: boolean;

  /** Global redemption cap across all customers. Null = unlimited. */
  @Column({ type: 'integer', nullable: true })
  usageLimit: number | null;

  @Column({ type: 'integer', default: 0 })
  usageCount: number;

  /** Max redemptions per customer. Null = unlimited. */
  @Column({ type: 'integer', nullable: true })
  perCustomerLimit: number | null;

  /**
   * Products this promotion discounts. Empty = a cart-wide promo (the legacy
   * behaviour); one or many items = the discount targets just those products.
   * Global — promotions are not scoped to a branch.
   */
  @ManyToMany(() => MenuItem)
  @JoinTable({
    name: 'promotion_items',
    joinColumn: { name: 'promotionId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'menuItemId', referencedColumnName: 'id' },
  })
  products: MenuItem[];
}
