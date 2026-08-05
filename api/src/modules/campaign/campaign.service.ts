import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Not, Repository } from 'typeorm';

import { AbstractService } from '@cor/abstract/service/abstract-service.service';
import { PaginationProvider } from '@modules/common/pagination/pagination.provider';
import { Paginated } from '@modules/common/pagination/interface/pagination.interface';
import { SettingService } from '@modules/setting/setting.service';
import { PromotionService } from '@modules/promotion/promotion.service';
import { Customer } from '@modules/customer/entities/customer.entity';

import { Campaign } from './entities/campaign.entity';
import { CampaignRecipient } from './entities/campaign-recipient.entity';
import { CampaignHelperService } from './services/campaign.helper.service';
import { CampaignValidatorService } from './services/campaign.validator.service';
import {
  WhatsappService,
  type WhatsappConfig,
  type WhatsappTemplate,
} from './services/whatsapp.service';
import {
  CreateCampaignDto,
  GetCampaignQueryDto,
  UpdateCampaignDto,
  WhatsappConfigDto,
} from './dto';

const WHATSAPP_GROUP = 'whatsapp';

@Injectable()
export class CampaignService extends AbstractService<Campaign> {
  constructor(
    @InjectRepository(Campaign)
    protected readonly repository: Repository<Campaign>,
    @InjectRepository(CampaignRecipient)
    private readonly recipients: Repository<CampaignRecipient>,
    @InjectRepository(Customer)
    private readonly customers: Repository<Customer>,
    protected readonly pagination: PaginationProvider,
    private readonly _helper: CampaignHelperService,
    private readonly _validator: CampaignValidatorService,
    private readonly _whatsapp: WhatsappService,
    private readonly _settings: SettingService,
    private readonly _promotions: PromotionService,
  ) {
    super(repository, pagination);
  }

  // ── CRUD ────────────────────────────────────────────────────────────────────

  getAll(query: GetCampaignQueryDto): Promise<Paginated<Campaign>> {
    const where = query.status ? { status: query.status as Campaign['status'] } : {};
    return this.pagination.paginationQuery(query, this.repository, where, undefined, undefined, {
      createdAt: 'DESC',
    });
  }

  getById(id: string): Promise<Campaign> {
    return this._validator.ensureExists(id);
  }

  createCampaign(dto: CreateCampaignDto): Promise<Campaign> {
    return this.create(this._helper.resolveCreatePayload(dto));
  }

  async updateCampaign(id: string, dto: UpdateCampaignDto): Promise<Campaign> {
    await this._validator.ensureExists(id);
    await this.repository.update(id, this._helper.resolveUpdatePayload(dto));
    return this.getById(id);
  }

  deleteCampaign(id: string) {
    return this.delete(id);
  }

  getRecipients(campaignId: string): Promise<CampaignRecipient[]> {
    return this.recipients.find({ where: { campaignId }, order: { createdAt: 'ASC' } });
  }

  /** The tenant's approved WhatsApp templates (from Meta) for the campaign form. */
  async getTemplates(): Promise<WhatsappTemplate[]> {
    return this._whatsapp.listTemplates(await this.getConfig());
  }

  // ── WhatsApp config (stored in settings, admin-only) ─────────────────────────

  async getConfig(): Promise<WhatsappConfig> {
    const g = await this._settings.getGroup(WHATSAPP_GROUP);
    return {
      enabled: g.enabled === 'true',
      phoneNumberId: g.phoneNumberId ?? '',
      accessToken: g.accessToken ?? '',
      businessAccountId: g.businessAccountId ?? '',
      storefrontUrl: g.storefrontUrl ?? '',
    };
  }

  async saveConfig(dto: WhatsappConfigDto): Promise<WhatsappConfig> {
    const values: Record<string, string> = {};
    if (dto.enabled !== undefined) values.enabled = String(dto.enabled);
    if (dto.phoneNumberId !== undefined) values.phoneNumberId = dto.phoneNumberId;
    if (dto.accessToken !== undefined) values.accessToken = dto.accessToken;
    if (dto.businessAccountId !== undefined) values.businessAccountId = dto.businessAccountId;
    if (dto.storefrontUrl !== undefined) values.storefrontUrl = dto.storefrontUrl;
    await this._settings.saveGroup(WHATSAPP_GROUP, values);
    return this.getConfig();
  }

  // ── Send ──────────────────────────────────────────────────────────────────

  /**
   * Send the campaign to every customer with a phone number. Uses the tenant's
   * WhatsApp credentials, or simulates the send when none are configured (so the
   * flow is testable at $0). Recipients are logged with per-message status.
   */
  async send(id: string): Promise<Campaign> {
    const campaign = await this._validator.ensureExists(id);
    const config = await this.getConfig();
    const promotion = campaign.promotionId
      ? await this._promotions.getById(campaign.promotionId).catch(() => null)
      : null;

    const isTemplate = campaign.messageType === 'template';
    const message = isTemplate
      ? ''
      : this._helper.buildMessage(campaign.body, promotion, config.storefrontUrl);
    const templateParams = isTemplate
      ? this._helper.buildTemplateParams(campaign.templateParams, promotion, config.storefrontUrl)
      : [];

    if (isTemplate && !campaign.templateName) {
      throw new BadRequestException('Select an approved template for this campaign');
    }
    if (!isTemplate && !message.trim()) {
      throw new BadRequestException('The campaign message is empty');
    }

    const audience = (
      await this.customers.find({ where: { phone: Not(IsNull()) } })
    ).filter((c) => c.phone && c.phone.trim());
    if (audience.length === 0) {
      throw new BadRequestException('No customers with a phone number to send to');
    }

    // Fresh send: clear any prior recipient log, mark sending.
    await this.recipients.delete({ campaignId: id });
    await this.repository.update(id, { status: 'sending', totalRecipients: audience.length });

    let sent = 0;
    let failed = 0;
    let simulatedAny = false;
    for (const c of audience) {
      const result = isTemplate
        ? await this._whatsapp.sendTemplate(
            config,
            c.phone!,
            campaign.templateName!,
            campaign.templateLanguage,
            templateParams,
          )
        : await this._whatsapp.sendText(config, c.phone!, message);
      simulatedAny = simulatedAny || result.simulated;
      await this.recipients.save(
        this.recipients.create({
          campaignId: id,
          customerId: c.id,
          name: c.name,
          phone: c.phone!,
          status: result.ok ? 'sent' : 'failed',
          messageId: result.messageId ?? null,
          error: result.error ?? null,
          sentAt: result.ok ? new Date() : null,
        }),
      );
      if (result.ok) sent++;
      else failed++;
    }

    await this.repository.update(id, {
      status: sent === 0 && failed > 0 ? 'failed' : 'sent',
      sentAt: new Date(),
      sentCount: sent,
      failedCount: failed,
      simulated: simulatedAny,
    });
    return this.getById(id);
  }
}
