import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Tax } from './tax.entity';

/** A bundle of taxes applied together; its effective rate is the sum of members. */
@Entity('tax_groups')
export class TaxGroup {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'varchar', nullable: true })
  code: string | null;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @ManyToMany(() => Tax, { eager: true })
  @JoinTable({
    name: 'tax_group_taxes',
    joinColumn: { name: 'taxGroupId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'taxId', referencedColumnName: 'id' },
  })
  taxes: Tax[];
}
