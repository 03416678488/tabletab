import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

/**
 * One recorded use of a promotion. Powers the per-customer usage limit (count
 * rows for a `promotionId` + `customerId`) and a redemption audit trail.
 */
@Index('IDX_promo_redemptions_promo_customer', ['promotionId', 'customerId'])
@Entity('promotion_redemptions')
export class PromotionRedemption {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn({ type: 'timestamptz' })
  redeemedAt: Date;

  @Column({ type: 'uuid' })
  promotionId: string;

  /** Null for guest checkouts (no account). */
  @Column({ type: 'uuid', nullable: true })
  customerId: string | null;

  @Column({ type: 'uuid', nullable: true })
  orderId: string | null;

  @Column({ type: 'varchar', nullable: true })
  code: string | null;

  @Column({ type: 'double precision', default: 0 })
  discountAmount: number;
}
