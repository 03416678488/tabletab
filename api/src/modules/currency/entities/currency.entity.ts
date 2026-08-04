import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Index(['code'], { unique: true })
@Entity('currencies')
export class Currency {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'varchar' })
  symbol: string;

  @Column({ type: 'varchar' })
  code: string;

  @Column({ type: 'double precision', default: 1 })
  exchangeRate: number;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  /** When true, the daily FX sync overwrites exchangeRate; false pins it manually. */
  @Column({ type: 'boolean', default: true })
  autoUpdate: boolean;
}
