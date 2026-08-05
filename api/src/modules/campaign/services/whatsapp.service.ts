import { Injectable, Logger } from '@nestjs/common';

export interface WhatsappConfig {
  enabled: boolean;
  phoneNumberId: string;
  accessToken: string;
  businessAccountId: string;
  storefrontUrl: string;
}

export interface WhatsappSendResult {
  ok: boolean;
  messageId?: string;
  error?: string;
  simulated: boolean;
}

export interface WhatsappTemplate {
  name: string;
  language: string;
  status: string;
  category?: string;
  /** Number of {{n}} placeholders in the body component. */
  bodyParamCount: number;
  bodyText: string;
}

const GRAPH_VERSION = 'v21.0';

/** Thin WhatsApp Cloud API client. Sends a plain-text message via the tenant's
 *  own credentials; falls back to a simulated send when unconfigured. */
@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);

  isConfigured(config: WhatsappConfig): boolean {
    return Boolean(config.enabled && config.phoneNumberId && config.accessToken);
  }

  async sendText(config: WhatsappConfig, to: string, body: string): Promise<WhatsappSendResult> {
    // No credentials → simulate so the whole flow works for free during setup.
    if (!this.isConfigured(config)) {
      return { ok: true, messageId: `sim-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, simulated: true };
    }

    const url = `https://graph.facebook.com/${GRAPH_VERSION}/${config.phoneNumberId}/messages`;
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: to.replace(/[^\d]/g, ''),
          type: 'text',
          text: { preview_url: true, body },
        }),
      });
      const data: any = await res.json().catch(() => ({}));
      if (!res.ok) {
        const error = data?.error?.message ?? `WhatsApp API error (${res.status})`;
        return { ok: false, error, simulated: false };
      }
      return { ok: true, messageId: data?.messages?.[0]?.id, simulated: false };
    } catch (err) {
      this.logger.warn(`WhatsApp send failed: ${(err as Error).message}`);
      return { ok: false, error: (err as Error).message, simulated: false };
    }
  }

  /** Send an approved template message with body parameters. */
  async sendTemplate(
    config: WhatsappConfig,
    to: string,
    templateName: string,
    languageCode: string,
    bodyParams: string[],
  ): Promise<WhatsappSendResult> {
    if (!this.isConfigured(config)) {
      return { ok: true, messageId: `sim-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, simulated: true };
    }
    const url = `https://graph.facebook.com/${GRAPH_VERSION}/${config.phoneNumberId}/messages`;
    const components =
      bodyParams.length > 0
        ? [{ type: 'body', parameters: bodyParams.map((text) => ({ type: 'text', text })) }]
        : [];
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: to.replace(/[^\d]/g, ''),
          type: 'template',
          template: {
            name: templateName,
            language: { code: languageCode || 'en_US' },
            ...(components.length ? { components } : {}),
          },
        }),
      });
      const data: any = await res.json().catch(() => ({}));
      if (!res.ok) {
        return { ok: false, error: data?.error?.message ?? `WhatsApp API error (${res.status})`, simulated: false };
      }
      return { ok: true, messageId: data?.messages?.[0]?.id, simulated: false };
    } catch (err) {
      return { ok: false, error: (err as Error).message, simulated: false };
    }
  }

  /** Fetch the tenant's approved message templates from Meta. */
  async listTemplates(config: WhatsappConfig): Promise<WhatsappTemplate[]> {
    if (!config.accessToken || !config.businessAccountId) return [];
    const url = `https://graph.facebook.com/${GRAPH_VERSION}/${config.businessAccountId}/message_templates?fields=name,status,language,category,components&limit=200`;
    try {
      const res = await fetch(url, { headers: { Authorization: `Bearer ${config.accessToken}` } });
      const data: any = await res.json().catch(() => ({}));
      if (!res.ok) {
        this.logger.warn(`Template list failed: ${data?.error?.message ?? res.status}`);
        return [];
      }
      return (data?.data ?? []).map((t: any) => {
        const body = (t.components ?? []).find((c: any) => c.type === 'BODY');
        const bodyText: string = body?.text ?? '';
        const bodyParamCount = (bodyText.match(/\{\{\d+\}\}/g) ?? []).length;
        return {
          name: t.name,
          language: t.language,
          status: t.status,
          category: t.category,
          bodyParamCount,
          bodyText,
        } as WhatsappTemplate;
      });
    } catch (err) {
      this.logger.warn(`Template list error: ${(err as Error).message}`);
      return [];
    }
  }
}
