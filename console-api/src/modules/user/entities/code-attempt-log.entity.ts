import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './users.entity';

@Entity('code_attempt_logs')
export class CodeAttemptLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  userId: string;

  @Column({
    type: 'varchar',
    length: 50,
    comment: 'Type of code (reset, verification)',
  })
  codeType: 'reset' | 'verification';

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
    comment: 'The code entered by user (hashed)',
  })
  enteredCode: string;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
    comment: 'The correct code (hashed)',
  })
  correctCode: string;

  @Column({
    type: 'boolean',
    default: false,
    comment: 'Whether entered code was correct',
  })
  isCorrect: boolean;

  @Column({
    type: 'varchar',
    length: 45,
    nullable: true,
    comment: 'IP address of the request',
  })
  ipAddress: string;

  @Column({
    type: 'text',
    nullable: true,
    comment: 'User agent of the browser',
  })
  userAgent: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    comment: 'Error message if attempt failed',
  })
  errorMessage: string;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.codeAttemptLogs, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user: User;
}
