import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('analytics')
export class Analytics {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar' })
  name: string;

  /** Tracking snippet / measurement id injected on the storefront. */
  @Column({ type: 'text', nullable: true })
  code: string | null;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;
}
