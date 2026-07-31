import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { File } from './file.entity';

@Entity('files_metadata')
export class FileMetadata {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true })
  fileId: string;

  @Column({ type: 'uuid', nullable: true })
  userId: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'boolean', default: false })
  isDeleted: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToOne(() => File, (file) => file.metadata, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'fileId' })
  file: File;
}
