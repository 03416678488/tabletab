import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export type CampaignStatus = 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed';
export type CampaignMessageType = 'text' | 'template';

/**
 * A WhatsApp broadcast to customers. Delivery goes through the tenant's own
 * WhatsApp Cloud API credentials (configured in settings). When credentials are
 * missing the send runs in simulate mode so the flow is testable for free.
 */
@Entity('campaigns')
export class Campaign {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @Column({ type: 'varchar' })
  name: string;

  /** 'text' = free-form session message; 'template' = approved Meta template. */
  @Column({ type: 'varchar', default: 'text' })
  messageType: CampaignMessageType;

  /** Message text (messageType='text'). A linked promotion appends its link. */
  @Column({ type: 'text', default: '' })
  body: string;

  /** Approved template name (messageType='template'). */
  @Column({ type: 'varchar', nullable: true })
  templateName: string | null;

  @Column({ type: 'varchar', default: 'en_US' })
  templateLanguage: string;

  /** Body parameter values for the template's {{1}}, {{2}}… placeholders.
   *  Supports the tokens `{code}` and `{link}` from an attached promotion. */
  @Column({ type: 'jsonb', default: () => "'[]'" })
  templateParams: string[];

  /** Optional promotion to feature (its code + `/promotion/{slug}` link). */
  @Column({ type: 'uuid', nullable: true })
  promotionId: string | null;

  @Column({ type: 'varchar', default: 'draft' })
  status: CampaignStatus;

  @Column({ type: 'timestamptz', nullable: true })
  scheduledAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  sentAt: Date | null;

  @Column({ type: 'integer', default: 0 })
  totalRecipients: number;

  @Column({ type: 'integer', default: 0 })
  sentCount: number;

  @Column({ type: 'integer', default: 0 })
  failedCount: number;

  /** True when the last send ran without real WhatsApp credentials (dry run). */
  @Column({ type: 'boolean', default: false })
  simulated: boolean;
}
