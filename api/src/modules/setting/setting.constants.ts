/** Default values seeded for the singleton setting groups. */
export const DEFAULT_SETTINGS: Record<string, Record<string, string>> = {
  company: {
    name: 'TableTap',
    email: 'info@tabletap.dev',
    phone: '',
    website: 'https://tabletap.dev',
    city: '',
    state: '',
    country_code: '',
    zip: '',
    address: '',
  },
  site: {
    date_format: 'DD-MM-YYYY',
    time_format: 'hh:mm A',
    default_timezone: 'UTC',
    default_branch: '',
    default_language: 'en',
    default_sms_gateway: '',
    android_app_link: '',
    ios_app_link: '',
    copyright: '© TableTap',
    google_map_key: '',
    digit_after_decimal: '2',
    default_ai_agent: '',
    default_currency: 'USD',
    default_phone_digit_length: '',
    currency_position: 'left', // left | right
    online_payment_gateway: 'disable',
    language_switch: 'enable',
    email_verification: 'disable',
    phone_verification: 'disable',
    app_debug: 'disable',
    guest_login: 'enable',
  },
  social_media: {
    facebook: '',
    youtube: '',
    instagram: '',
    twitter: '',
  },
  theme: {
    primary_color: '#0f766e',
    logo: '',
    fav_icon: '',
    footer_logo: '',
  },
};

/** Groups the public GET /settings exposes (safe for the storefront/app). */
// `reservation` is public so the storefront booking flow can read the tenant's
// reservation window / turn time / party limit (Settings → Reservation Time).
export const PUBLIC_GROUPS = [
  'company',
  'site',
  'social_media',
  'theme',
  'reservation',
];
