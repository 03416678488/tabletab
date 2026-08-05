import { httpClient } from "@/lib/httpClient";
import { CAMPAIGN_ENDPOINTS } from "@/features/campaign/constants/campaign.constants";
import type {
  Campaign,
  CampaignRecipient,
  CreateCampaignInput,
  ListCampaignsParams,
  Paginated,
  UpdateCampaignInput,
  WhatsappConfig,
  WhatsappTemplate,
} from "@/features/campaign/types/campaign.types";

export const campaignService = {
  list(params?: ListCampaignsParams) {
    return httpClient
      .get<Paginated<Campaign>>(CAMPAIGN_ENDPOINTS.base, {
        auth: true,
        params: {
          page: params?.page,
          perPage: params?.perPage,
          search: params?.search,
          status: params?.status,
        },
      })
      .then((res) => res.data);
  },

  create(body: CreateCampaignInput) {
    return httpClient
      .post<Campaign>(CAMPAIGN_ENDPOINTS.base, body, { auth: true })
      .then((res) => res.data);
  },

  update(id: string, body: UpdateCampaignInput) {
    return httpClient
      .put<Campaign>(CAMPAIGN_ENDPOINTS.byId(id), body, { auth: true })
      .then((res) => res.data);
  },

  remove(id: string) {
    return httpClient
      .delete<{ message: string }>(CAMPAIGN_ENDPOINTS.byId(id), { auth: true })
      .then((res) => res.data);
  },

  send(id: string) {
    return httpClient
      .post<Campaign>(CAMPAIGN_ENDPOINTS.send(id), undefined, { auth: true })
      .then((res) => res.data);
  },

  recipients(id: string) {
    return httpClient
      .get<CampaignRecipient[]>(CAMPAIGN_ENDPOINTS.recipients(id), { auth: true })
      .then((res) => res.data);
  },

  getConfig() {
    return httpClient
      .get<WhatsappConfig>(CAMPAIGN_ENDPOINTS.config, { auth: true })
      .then((res) => res.data);
  },

  saveConfig(body: Partial<WhatsappConfig>) {
    return httpClient
      .put<WhatsappConfig>(CAMPAIGN_ENDPOINTS.config, body, { auth: true })
      .then((res) => res.data);
  },

  templates() {
    return httpClient
      .get<WhatsappTemplate[]>(CAMPAIGN_ENDPOINTS.templates, { auth: true })
      .then((res) => res.data);
  },
};
