import {
  Column,
  CreateDateColumn,
  Entity,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { FileMetadata } from './file-metadata.entity';

@Entity('files')
export class File {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', nullable: true })
  fileName: string;

  @Column({ type: 'varchar', nullable: true })
  originalFileName: string;

  @Column({ type: 'varchar', nullable: true })
  mimetype: string;

  @Column({ type: 'text', nullable: true })
  path: string;

  @Column({ type: 'int', nullable: true })
  size: number;

  /** Folder this image belongs to (null = root/uncategorised). */
  @Column({ type: 'uuid', nullable: true })
  folderId: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToOne(() => FileMetadata, (metadata) => metadata.file)
  metadata: FileMetadata;
}
