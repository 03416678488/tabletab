import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

/** A single key-value setting, grouped by section (company, site, mail, …). */
@Index(['group', 'key'], { unique: true })
@Entity('settings')
export class Setting {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar' })
  group: string;

  @Column({ type: 'varchar' })
  key: string;

  @Column({ type: 'text', nullable: true })
  value: string | null;
}
