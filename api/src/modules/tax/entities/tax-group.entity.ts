import {
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Tax } from './tax.entity';
import { Branch } from '@modules/branch/entities/branch.entity';

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

  @Column({ type: 'uuid', nullable: true })
  branchId: string | null;

  @ManyToOne(() => Branch, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'branchId' })
  branch: Branch | null;

  @ManyToMany(() => Tax, { eager: true })
  @JoinTable({
    name: 'tax_group_taxes',
    joinColumn: { name: 'taxGroupId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'taxId', referencedColumnName: 'id' },
  })
  taxes: Tax[];
}
