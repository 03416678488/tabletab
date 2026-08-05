import { Injectable } from '@nestjs/common';

import { Campaign } from '../entities/campaign.entity';
import { Promotion } from '@modules/promotion/entities/promotion.entity';
import { CreateCampaignDto, UpdateCampaignDto } from '../dto';

/** Pure helpers: payload normalisation + WhatsApp message composition. */
@Injectable()
export class CampaignHelperService {
  resolveCreatePayload(dto: CreateCampaignDto): Partial<Campaign> {
    return {
      name: dto.name,
      messageType: dto.messageType ?? 'text',
      body: dto.body ?? '',
      templateName: dto.templateName ?? null,
      templateLanguage: dto.templateLanguage ?? 'en_US',
      templateParams: dto.templateParams ?? [],
      promotionId: dto.promotionId ?? null,
      scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : null,
      status: dto.scheduledAt ? 'scheduled' : 'draft',
    };
  }

  resolveUpdatePayload(dto: UpdateCampaignDto): Partial<Campaign> {
    const out: Partial<Campaign> = {};
    if (dto.name !== undefined) out.name = dto.name;
    if (dto.messageType !== undefined) out.messageType = dto.messageType;
    if (dto.body !== undefined) out.body = dto.body;
    if (dto.templateName !== undefined) out.templateName = dto.templateName ?? null;
    if (dto.templateLanguage !== undefined) out.templateLanguage = dto.templateLanguage ?? 'en_US';
    if (dto.templateParams !== undefined) out.templateParams = dto.templateParams ?? [];
    if (dto.promotionId !== undefined) out.promotionId = dto.promotionId ?? null;
    if (dto.scheduledAt !== undefined) out.scheduledAt = dto.scheduledAt ? new Date(dto.scheduledAt) : null;
    return out;
  }

  /** Substitute {code} / {link} tokens in a template's body parameters using the
   *  attached promotion (empty string when a token has no value). */
  buildTemplateParams(params: string[], promotion: Promotion | null, storefrontUrl: string): string[] {
    const code = promotion?.code ?? '';
    const base = storefrontUrl.replace(/\/+$/, '');
    const link = promotion && base ? `${base}/promotion/${promotion.slug}` : '';
    return (params ?? []).map((p) =>
      (p ?? '').replace(/\{code\}/gi, code).replace(/\{link\}/gi, link),
    );
  }

  /**
   * Final message text: the campaign body, plus a featured promotion's code and
   * `/promotion/{slug}` landing link when one is attached.
   */
  buildMessage(body: string, promotion: Promotion | null, storefrontUrl: string): string {
    let text = body?.trim() ?? '';
    if (promotion) {
      const parts: string[] = [];
      if (promotion.code) parts.push(`🎟 Use code *${promotion.code}*`);
      const base = storefrontUrl.replace(/\/+$/, '');
      if (base) parts.push(`${base}/promotion/${promotion.slug}`);
      if (parts.length) text = [text, parts.join('\n')].filter(Boolean).join('\n\n');
    }
    return text;
  }
}
