import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Index(['code'], { unique: true })
@Entity('taxes')
export class Tax {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'varchar' })
  code: string;

  @Column({ type: 'double precision', default: 0 })
  rate: number;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;
}
