import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

export type RecipientStatus = 'pending' | 'sent' | 'failed';

/** One customer's send within a campaign — the delivery log + status. */
@Index('IDX_campaign_recipients_campaign', ['campaignId'])
@Entity('campaign_recipients')
export class CampaignRecipient {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @Column({ type: 'uuid' })
  campaignId: string;

  @Column({ type: 'uuid', nullable: true })
  customerId: string | null;

  @Column({ type: 'varchar', nullable: true })
  name: string | null;

  @Column({ type: 'varchar' })
  phone: string;

  @Column({ type: 'varchar', default: 'pending' })
  status: RecipientStatus;

  /** Meta message id (wamid) on success, or a `sim-…` id in simulate mode. */
  @Column({ type: 'varchar', nullable: true })
  messageId: string | null;

  @Column({ type: 'varchar', nullable: true })
  error: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  sentAt: Date | null;
}
