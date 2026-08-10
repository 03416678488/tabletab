import { Column, Entity } from 'typeorm';

import { AbstractEntity } from '@cor/abstract/entity/abstract-entity.abstract';

export type ServiceRequestType = 'waiter' | 'bill';
export type ServiceRequestStatus = 'open' | 'resolved';

/**
 * A guest-initiated service request from a table (scan → "Call waiter" / "ready
 * to pay"). Staff see open ones live on the waiter/manager board and resolve them.
 */
@Entity('service_requests')
export class ServiceRequest extends AbstractEntity {
  @Column({ type: 'varchar' })
  type: ServiceRequestType;

  @Column({ type: 'varchar', default: 'open' })
  status: ServiceRequestStatus;

  @Column({ type: 'uuid', nullable: true })
  tableId: string | null;

  /** Snapshot of the table name for display without a join. */
  @Column({ type: 'varchar', nullable: true })
  tableName: string | null;

  @Column({ type: 'uuid', nullable: true })
  branchId: string | null;

  /** The on-shift waiter this request was assigned to (null = broadcast fallback). */
  @Column({ type: 'uuid', nullable: true })
  assignedUserId: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  resolvedAt: Date | null;
}
