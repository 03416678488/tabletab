/**
 * Static marketplace catalog — the providers a tenant can connect. Adding a
 * provider = adding an entry here (+ a connector implementation, later phases).
 *
 * `authType`:
 *   - api_key  → the tenant enters the `fields` and we store them.
 *   - oauth    → an authorize redirect (Phase 2+); shown as "Coming soon" for now.
 *   - builtin  → already configured elsewhere in the app (`manageSlug`).
 */
export type IntegrationCategory =
  | 'delivery'
  | 'payments'
  | 'messaging'
  | 'accounting'
  | 'marketing';

export type IntegrationStatus = 'available' | 'coming_soon';
export type IntegrationAuthType = 'api_key' | 'oauth' | 'builtin';

export interface IntegrationField {
  key: string;
  label: string;
  type?: 'text' | 'password';
  placeholder?: string;
}

export interface Connector {
  key: string;
  name: string;
  category: IntegrationCategory;
  description: string;
  status: IntegrationStatus;
  authType: IntegrationAuthType;
  /** api_key connectors: the credential inputs to collect. */
  fields?: IntegrationField[];
  /** builtin connectors: dashboard slug that already manages this. */
  manageSlug?: string;
  /** Webhook connectors: the path providers should POST to (shown to the user). */
  webhookPath?: string;
  /** Whether this provider supports pushing our menu out to it. */
  canPushMenu?: boolean;
}

/** Shared credential fields for delivery aggregators (foodpanda/uber/deliveroo).
 *  Orders come in via a per-tenant webhook URL (token minted on connect — no
 *  manual secret); these fields are only for the outbound menu/status API. */
export const AGGREGATOR_FIELDS: IntegrationField[] = [
  {
    key: 'apiBaseUrl',
    label: 'API base URL (menu + status out, optional)',
    placeholder: 'https://…/v1',
  },
  { key: 'apiKey', label: 'API key (optional)', type: 'password' },
];

export const INTEGRATION_CATALOG: Connector[] = [
  {
    key: 'foodpanda',
    name: 'foodpanda',
    category: 'delivery',
    description: 'Pull foodpanda orders straight onto the KDS via webhook.',
    status: 'available',
    authType: 'api_key',
    fields: AGGREGATOR_FIELDS,
    webhookPath: '/integrations/foodpanda/webhook',
    canPushMenu: true,
  },
  {
    key: 'ubereats',
    name: 'Uber Eats',
    category: 'delivery',
    description: 'Receive Uber Eats orders on the KDS and push your menu out.',
    status: 'available',
    authType: 'api_key',
    fields: AGGREGATOR_FIELDS,
    webhookPath: '/integrations/ubereats/webhook',
    canPushMenu: true,
  },
  {
    key: 'deliveroo',
    name: 'Deliveroo',
    category: 'delivery',
    description: 'Ingest Deliveroo orders on the KDS and keep the menu in sync.',
    status: 'available',
    authType: 'api_key',
    fields: AGGREGATOR_FIELDS,
    webhookPath: '/integrations/deliveroo/webhook',
    canPushMenu: true,
  },
  {
    key: 'stripe',
    name: 'Stripe',
    category: 'payments',
    description: 'Accept card payments online and at the counter.',
    status: 'available',
    authType: 'api_key',
    fields: [
      { key: 'publishableKey', label: 'Publishable key', placeholder: 'pk_live_…' },
      { key: 'secretKey', label: 'Secret key', type: 'password', placeholder: 'sk_live_…' },
    ],
  },
  {
    key: 'twilio',
    name: 'Twilio SMS',
    category: 'messaging',
    description: 'Send order and reservation updates over SMS.',
    status: 'available',
    authType: 'api_key',
    fields: [
      { key: 'accountSid', label: 'Account SID', placeholder: 'AC…' },
      { key: 'authToken', label: 'Auth token', type: 'password' },
      { key: 'fromNumber', label: 'From number', placeholder: '+1…' },
    ],
  },
  {
    key: 'whatsapp',
    name: 'WhatsApp',
    category: 'messaging',
    description: 'Run WhatsApp campaigns and template messages.',
    status: 'available',
    authType: 'builtin',
    manageSlug: 'campaigns',
  },
  {
    key: 'quickbooks',
    name: 'QuickBooks',
    category: 'accounting',
    description: 'Push sales and expenses to your books automatically.',
    status: 'coming_soon',
    authType: 'oauth',
  },
  {
    key: 'google_business',
    name: 'Google Business',
    category: 'marketing',
    description: 'Sync hours, menu and reviews to your Google profile.',
    status: 'coming_soon',
    authType: 'oauth',
  },
];

export const findConnector = (key: string): Connector | undefined =>
  INTEGRATION_CATALOG.find((c) => c.key === key);
