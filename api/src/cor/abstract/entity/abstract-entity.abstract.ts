import { CreateDateColumn, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { toIsoTimestamp } from '@cor/helpers/date.helpers';

export abstract class AbstractEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn({
    transformer: {
      to: (value) => value,
      from: (value) => toIsoTimestamp(value),
    },
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date;

  @UpdateDateColumn({
    transformer: {
      to: (value) => value,
      from: (value) => toIsoTimestamp(value),
    },
    default: () => 'CURRENT_TIMESTAMP',
    nullable: true,
  })
  updatedAt: Date;
}
