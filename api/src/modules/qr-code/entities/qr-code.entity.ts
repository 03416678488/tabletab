import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { AbstractEntity } from '@cor/abstract/entity/abstract-entity.abstract';
import { Table } from '@modules/table/entities/table.entity';
import { Branch } from '@modules/branch/entities/branch.entity';

/** Table codes encode /t/{slug} (dine-in); custom codes encode raw `content`. */
export type QrCodeKind = 'table' | 'custom';

/** Presentation hint for a custom code (also decides how `content` is built). */
export type QrCustomType =
  'url' | 'review' | 'wifi' | 'text' | 'phone' | 'email';

@Index(['slug'], { unique: true })
// Unique per table, but nullable for custom codes — Postgres treats NULLs as
// distinct, so many custom rows (tableId = NULL) coexist while each table keeps
// at most one code.
@Index(['tableId'], { unique: true })
@Entity('qr_codes')
export class QrCode extends AbstractEntity {
  /** Public token embedded in the scan URL, e.g. /t/{slug}. */
  @Column({ type: 'varchar' })
  slug: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  /** 'table' (auto-generated, one per table) or 'custom' (user-defined). */
  @Column({ type: 'varchar', default: 'table' })
  kind: QrCodeKind;

  // --- Table codes ---
  @Column({ type: 'uuid', nullable: true })
  tableId: string | null;

  @ManyToOne(() => Table, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tableId' })
  table: Table | null;

  /**
   * Owning branch. Table codes leave this null (their branch comes from the
   * table); custom codes carry the branch they were created under, so they
   * scope to it. Null custom codes are treated as "all branches" legacy.
   */
  @Column({ type: 'uuid', nullable: true })
  branchId: string | null;

  @ManyToOne(() => Branch, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'branchId' })
  branch: Branch | null;

  // --- Custom codes ---
  /** Display name for a custom code, e.g. "Google Review" or "Guest WiFi". */
  @Column({ type: 'varchar', nullable: true })
  label: string | null;

  /** What a custom code represents — drives the icon and how `content` is read. */
  @Column({ type: 'varchar', nullable: true })
  customType: QrCustomType | null;

  /** The exact string a custom code encodes (URL, `WIFI:…`, `tel:…`, text). */
  @Column({ type: 'text', nullable: true })
  content: string | null;
}
