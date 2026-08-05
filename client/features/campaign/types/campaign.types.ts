export type CampaignStatus = "draft" | "scheduled" | "sending" | "sent" | "failed";
export type RecipientStatus = "pending" | "sent" | "failed";
export type CampaignMessageType = "text" | "template";

export interface WhatsappTemplate {
  name: string;
  language: string;
  status: string;
  category?: string;
  bodyParamCount: number;
  bodyText: string;
}

export interface Campaign {
  id: string;
  createdAt: string;
  updatedAt: string;
  name: string;
  messageType: CampaignMessageType;
  body: string;
  templateName: string | null;
  templateLanguage: string;
  templateParams: string[];
  promotionId: string | null;
  status: CampaignStatus;
  scheduledAt: string | null;
  sentAt: string | null;
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
  simulated: boolean;
}

export interface CampaignRecipient {
  id: string;
  campaignId: string;
  customerId: string | null;
  name: string | null;
  phone: string;
  status: RecipientStatus;
  messageId: string | null;
  error: string | null;
  sentAt: string | null;
}

export interface WhatsappConfig {
  enabled: boolean;
  phoneNumberId: string;
  accessToken: string;
  businessAccountId: string;
  storefrontUrl: string;
}

export interface Paginated<T> {
  items: T[];
  meta: {
    itemsPerPage: number;
    totalItems: number;
    currentPage: number;
    totalPages: number;
  };
}

export interface CreateCampaignInput {
  name: string;
  messageType?: CampaignMessageType;
  body?: string;
  templateName?: string;
  templateLanguage?: string;
  templateParams?: string[];
  promotionId?: string;
  scheduledAt?: string;
}

export type UpdateCampaignInput = Partial<CreateCampaignInput>;

export interface ListCampaignsParams {
  page?: number;
  perPage?: number;
  search?: string;
  status?: CampaignStatus;
}
