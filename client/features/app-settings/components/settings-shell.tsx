"use client";

import { useState } from "react";
import {
  BarChart3,
  Bell,
  Bot,
  Building2,
  CalendarClock,
  Clock,
  Coins,
  Cookie,
  CreditCard,
  Globe,
  KeyRound,
  Mail,
  MessageSquare,
  Monitor,
  Palette,
  Share2,
  ShieldCheck,
  ShoppingCart,
  SlidersHorizontal,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useI18n } from "@/features/i18n/i18n-provider";
import { LanguageSwitcher } from "@/features/i18n/language-switcher";
import { CompanyForm } from "@/features/app-settings/components/company-form";
import { SiteForm } from "@/features/app-settings/components/site-form";
import { SettingsForm } from "@/features/app-settings/components/settings-form";
import { OpeningTimesForm } from "@/features/app-settings/components/opening-times-form";
import { ProviderTabs } from "@/features/app-settings/components/provider-tabs";
import { ThemeForm } from "@/features/app-settings/components/theme-form";
import { CurrencyManager } from "@/features/currency/components/currency-manager";
import { LanguageManager } from "@/features/language/components/language-manager";
import { KioskMachineManager } from "@/features/kiosk-machine/components/kiosk-machine-manager";
import { AnalyticsManager } from "@/features/analytics/components/analytics-manager";
import { TimeSlotManager } from "@/features/time-slot/components/time-slot-manager";
import { RolePermissionManager } from "@/features/role-permission/components/role-permission-manager";

type SectionKey =
  | "company"
  | "site"
  | "opening_times"
  | "reservation"
  | "mail"
  | "order"
  | "otp"
  | "notification"
  | "social"
  | "cookies"
  | "theme"
  | "ai_agent"
  | "sms"
  | "payment"
  | "social_login"
  | "currencies"
  | "languages"
  | "kiosk"
  | "analytics"
  | "time_slots"
  | "roles";

const SECTIONS: { key: SectionKey; i18n: string; label: string; icon: typeof Building2 }[] = [
  { key: "company", i18n: "settings.company", label: "Company", icon: Building2 },
  { key: "site", i18n: "settings.site", label: "Site", icon: SlidersHorizontal },
  { key: "opening_times", i18n: "settings.opening_times", label: "Opening Times", icon: Clock },
  { key: "reservation", i18n: "settings.reservation", label: "Reservation Time", icon: CalendarClock },
  { key: "kiosk", i18n: "settings.kiosk", label: "Kiosk Machines", icon: Monitor },
  { key: "mail", i18n: "settings.mail", label: "Mail", icon: Mail },
  { key: "order", i18n: "settings.order", label: "Order Setup", icon: ShoppingCart },
  { key: "otp", i18n: "settings.otp", label: "OTP", icon: Bell },
  { key: "notification", i18n: "settings.notification", label: "Notification", icon: Bell },
  { key: "social", i18n: "settings.social", label: "Social Media", icon: Share2 },
  { key: "cookies", i18n: "settings.cookies", label: "Cookies", icon: Cookie },
  { key: "analytics", i18n: "settings.analytics", label: "Analytics", icon: BarChart3 },
  { key: "theme", i18n: "settings.theme", label: "Theme", icon: Palette },
  { key: "time_slots", i18n: "settings.time_slots", label: "Time Slots", icon: Clock },
  { key: "ai_agent", i18n: "settings.ai_agent", label: "AI Agent", icon: Bot },
  { key: "sms", i18n: "settings.sms", label: "SMS Gateway", icon: MessageSquare },
  { key: "payment", i18n: "settings.payment", label: "Payment Gateway", icon: CreditCard },
  { key: "social_login", i18n: "settings.social_login", label: "Social Login", icon: KeyRound },
  { key: "currencies", i18n: "settings.currencies", label: "Currencies", icon: Coins },
  { key: "languages", i18n: "settings.languages", label: "Languages", icon: Globe },
  { key: "roles", i18n: "settings.roles", label: "Roles & Permissions", icon: ShieldCheck },
];

export function SettingsShell() {
  const [active, setActive] = useState<SectionKey>("company");
  const { t } = useI18n();

  return (
    <div className="w-full">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-xl font-semibold tracking-tight text-ink">
          {t("settings.title", "Settings")}
        </h1>
        <LanguageSwitcher />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[220px_1fr]">
        {/* Section nav */}
        <nav className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
          {SECTIONS.map((s) => {
            const Icon = s.icon;
            const on = active === s.key;
            return (
              <button
                key={s.key}
                type="button"
                onClick={() => setActive(s.key)}
                className={cn(
                  "flex shrink-0 items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-left text-sm font-medium transition-colors",
                  on
                    ? "bg-brand-tint text-brand-deep"
                    : "text-muted-foreground hover:bg-secondary hover:text-ink",
                )}
              >
                <Icon className="size-4" />
                {t(s.i18n, s.label)}
              </button>
            );
          })}
        </nav>

        {/* Content */}
        <div className="min-w-0">
          {active === "company" && <CompanyForm />}
          {active === "site" && <SiteForm />}
          {active === "opening_times" && <OpeningTimesForm />}
          {active === "reservation" && (
            <SettingsForm
              group="reservation"
              title="Reservation Time"
              fields={[
                { key: "enabled", label: "Reservations Enabled", type: "toggle" },
                { key: "open_time", label: "Reservations From", type: "time" },
                { key: "close_time", label: "Reservations Until", type: "time" },
                { key: "slot_duration", label: "Slot Duration (min)", type: "number" },
                { key: "max_party_size", label: "Max Party Size", type: "number" },
                { key: "advance_days", label: "Book Up To (days ahead)", type: "number" },
                { key: "min_notice_hours", label: "Minimum Notice (hours)", type: "number" },
                { key: "hold_minutes", label: "Table Hold / Grace (min)", type: "number" },
              ]}
            />
          )}
          {active === "kiosk" && <KioskMachineManager />}
          {active === "analytics" && <AnalyticsManager />}
          {active === "time_slots" && <TimeSlotManager />}
          {active === "mail" && (
            <SettingsForm
              group="mail"
              title="Mail"
              fields={[
                { key: "mail_host", label: "Mail Host" },
                { key: "mail_port", label: "Mail Port" },
                { key: "mail_username", label: "Mail Username" },
                { key: "mail_password", label: "Mail Password", type: "password" },
                { key: "mail_from_name", label: "Mail From Name" },
                { key: "mail_from_email", label: "Mail From Email", type: "email" },
                {
                  key: "mail_encryption",
                  label: "Mail Encryption",
                  type: "select",
                  options: [
                    { value: "ssl", label: "SSL" },
                    { value: "tls", label: "TLS" },
                  ],
                },
              ]}
            />
          )}
          {active === "order" && (
            <SettingsForm
              group="order"
              title="Order Setup"
              fields={[
                { key: "food_prep_time", label: "Food Preparation Time (min)", type: "number" },
                {
                  key: "schedule_slot_duration",
                  label: "Schedule Order Slot Duration (min)",
                  type: "number",
                },
                { key: "takeaway", label: "Takeaway", type: "toggle" },
                { key: "delivery", label: "Delivery", type: "toggle" },
                { key: "free_delivery_km", label: "Free Delivery Kilometer", type: "number" },
                { key: "basic_delivery_charge", label: "Basic Delivery Charge", type: "number" },
                { key: "charge_per_kilo", label: "Charge Per Kilo", type: "number" },
              ]}
            />
          )}
          {active === "otp" && (
            <SettingsForm
              group="otp"
              title="OTP"
              fields={[
                {
                  key: "otp_type",
                  label: "OTP Type",
                  type: "select",
                  options: [
                    { value: "sms", label: "SMS" },
                    { value: "email", label: "Email" },
                    { value: "both", label: "Both" },
                  ],
                },
                {
                  key: "otp_digit_limit",
                  label: "OTP Digit Limit",
                  type: "select",
                  options: [
                    { value: "4", label: "4" },
                    { value: "5", label: "5" },
                    { value: "6", label: "6" },
                  ],
                },
                {
                  key: "otp_expire_time",
                  label: "OTP Expire Time (min)",
                  type: "select",
                  options: [
                    { value: "1", label: "1" },
                    { value: "3", label: "3" },
                    { value: "5", label: "5" },
                    { value: "10", label: "10" },
                  ],
                },
              ]}
            />
          )}
          {active === "notification" && (
            <SettingsForm
              group="notification"
              title="Notification (Firebase)"
              fields={[
                { key: "firebase_vapid_key", label: "Firebase Public Vapid Key" },
                { key: "firebase_api_key", label: "Firebase API Key" },
                { key: "firebase_auth_domain", label: "Firebase Auth Domain" },
                { key: "firebase_project_id", label: "Firebase Project ID" },
                { key: "firebase_storage_bucket", label: "Firebase Storage Bucket" },
                { key: "firebase_sender_id", label: "Firebase Message Sender ID" },
                { key: "firebase_app_id", label: "Firebase App ID" },
                { key: "firebase_measurement_id", label: "Firebase Measurement ID" },
              ]}
            />
          )}
          {active === "social" && (
            <SettingsForm
              group="social_media"
              title="Social Media"
              fields={[
                { key: "facebook", label: "Facebook", type: "url" },
                { key: "youtube", label: "YouTube", type: "url" },
                { key: "instagram", label: "Instagram", type: "url" },
                { key: "twitter", label: "Twitter", type: "url" },
              ]}
            />
          )}
          {active === "cookies" && (
            <SettingsForm
              group="cookies"
              title="Cookies"
              fields={[{ key: "cookies_summary", label: "Cookies Summary", type: "textarea" }]}
            />
          )}
          {active === "theme" && <ThemeForm />}
          {active === "ai_agent" && (
            <SettingsForm
              group="ai_agent"
              title="AI Agent"
              fields={[
                {
                  key: "provider",
                  label: "Provider",
                  type: "select",
                  options: [
                    { value: "openai", label: "OpenAI" },
                    { value: "anthropic", label: "Anthropic (Claude)" },
                    { value: "gemini", label: "Google Gemini" },
                  ],
                },
                { key: "api_key", label: "API Key", type: "password" },
                { key: "model", label: "Model" },
                { key: "system_prompt", label: "System Prompt", type: "textarea" },
                { key: "enabled", label: "Enabled", type: "toggle" },
              ]}
            />
          )}
          {active === "sms" && (
            <ProviderTabs
              tabs={[
                {
                  key: "twilio",
                  label: "Twilio",
                  group: "sms_twilio",
                  fields: [
                    { key: "account_sid", label: "Twilio Account SID" },
                    { key: "auth_token", label: "Twilio Auth Token", type: "password" },
                    { key: "from", label: "Twilio From" },
                  ],
                },
                {
                  key: "clickatell",
                  label: "Clickatell",
                  group: "sms_clickatell",
                  fields: [
                    { key: "api_key", label: "API Key", type: "password" },
                    { key: "from", label: "From" },
                  ],
                },
                {
                  key: "nexmo",
                  label: "Nexmo",
                  group: "sms_nexmo",
                  fields: [
                    { key: "api_key", label: "API Key" },
                    { key: "api_secret", label: "API Secret", type: "password" },
                    { key: "from", label: "From" },
                  ],
                },
              ]}
            />
          )}
          {active === "payment" && (
            <ProviderTabs
              tabs={[
                {
                  key: "stripe",
                  label: "Stripe",
                  group: "payment_stripe",
                  fields: [
                    { key: "publishable_key", label: "Publishable Key" },
                    { key: "secret_key", label: "Secret Key", type: "password" },
                  ],
                },
                {
                  key: "paypal",
                  label: "PayPal",
                  group: "payment_paypal",
                  fields: [
                    { key: "client_id", label: "Client ID" },
                    { key: "client_secret", label: "Client Secret", type: "password" },
                    {
                      key: "mode",
                      label: "Mode",
                      type: "select",
                      options: [
                        { value: "sandbox", label: "Sandbox" },
                        { value: "live", label: "Live" },
                      ],
                    },
                  ],
                },
                {
                  key: "razorpay",
                  label: "Razorpay",
                  group: "payment_razorpay",
                  fields: [
                    { key: "key_id", label: "Key ID" },
                    { key: "key_secret", label: "Key Secret", type: "password" },
                  ],
                },
                {
                  key: "cod",
                  label: "Cash on Delivery",
                  group: "payment_cod",
                  fields: [{ key: "instructions", label: "Instructions", type: "textarea" }],
                },
              ]}
            />
          )}
          {active === "social_login" && (
            <ProviderTabs
              tabs={[
                {
                  key: "google",
                  label: "Google",
                  group: "social_google",
                  fields: [
                    { key: "client_id", label: "Client ID" },
                    { key: "client_secret", label: "Client Secret", type: "password" },
                  ],
                },
                {
                  key: "facebook",
                  label: "Facebook",
                  group: "social_facebook",
                  fields: [
                    { key: "app_id", label: "App ID" },
                    { key: "app_secret", label: "App Secret", type: "password" },
                  ],
                },
                {
                  key: "apple",
                  label: "Apple",
                  group: "social_apple",
                  fields: [
                    { key: "client_id", label: "Client ID" },
                    { key: "team_id", label: "Team ID" },
                    { key: "key_id", label: "Key ID" },
                  ],
                },
              ]}
            />
          )}
          {active === "currencies" && <CurrencyManager />}
          {active === "languages" && <LanguageManager />}
          {active === "roles" && <RolePermissionManager />}
        </div>
      </div>
    </div>
  );
}
