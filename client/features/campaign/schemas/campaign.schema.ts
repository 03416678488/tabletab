import { z } from "zod";

export const campaignSchema = z.object({
  name: z.string().min(1, "Name is required"),
  messageType: z.enum(["text", "template"]),
  body: z.string().optional(),
  templateName: z.string().optional(),
  templateLanguage: z.string().optional(),
  templateParams: z.array(z.string()).optional(),
  promotionId: z.string().optional(),
  scheduledAt: z.string().optional(),
});

export type CampaignFormValues = z.infer<typeof campaignSchema>;

export const whatsappConfigSchema = z.object({
  enabled: z.boolean(),
  phoneNumberId: z.string().optional(),
  accessToken: z.string().optional(),
  businessAccountId: z.string().optional(),
  storefrontUrl: z.string().optional(),
});

export type WhatsappConfigFormValues = z.infer<typeof whatsappConfigSchema>;
