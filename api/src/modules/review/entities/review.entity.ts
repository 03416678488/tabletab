import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { AbstractEntity } from '@cor/abstract/entity/abstract-entity.abstract';
import { MenuItem } from '@modules/menu/entities/menu-item.entity';
import { Branch } from '@modules/branch/entities/branch.entity';

/** Moderation lifecycle — a review is only public once an admin approves it. */
export type ReviewStatus = 'pending' | 'approved' | 'rejected';

export type ReviewSource = 'online' | 'staff';

/** A guest's rating + comment on a menu item, held for admin moderation. */
@Index(['menuItemId', 'status'])
@Entity('item_reviews')
export class Review extends AbstractEntity {
  @Column({ type: 'uuid' })
  menuItemId: string;

  @ManyToOne(() => MenuItem, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'menuItemId' })
  menuItem: MenuItem;

  /** Branch the guest was ordering from, when known (for attribution). */
  @Column({ type: 'uuid', nullable: true })
  branchId: string | null;

  @ManyToOne(() => Branch, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'branchId' })
  branch: Branch;

  /** 1–5 stars. */
  @Column({ type: 'int' })
  rating: number;

  @Column({ type: 'text', nullable: true })
  comment: string | null;

  @Column({ type: 'varchar' })
  guestName: string;

  @Column({ type: 'varchar', nullable: true })
  guestEmail: string | null;

  @Column({ type: 'varchar', default: 'pending' })
  status: ReviewStatus;

  @Column({ type: 'varchar', default: 'online' })
  source: ReviewSource;

  /** When an admin approved/rejected it, and who. */
  @Column({ type: 'timestamptz', nullable: true })
  moderatedAt: Date | null;

  @Column({ type: 'uuid', nullable: true })
  moderatedBy: string | null;
}
