"use client";

import { useState } from "react";
import {
  BarChart3,
  Building2,
  CalendarClock,
  Clock,
  Coins,
  Cookie,
  CreditCard,
  Globe,
  Mail,
  Palette,
  ShieldCheck,
  ShoppingCart,
  SlidersHorizontal,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useI18n } from "@/features/i18n/i18n-provider";
import { CompanyForm } from "@/features/app-settings/components/company-form";
import { SiteForm } from "@/features/app-settings/components/site-form";
import { SettingsForm } from "@/features/app-settings/components/settings-form";
import { OpeningTimesForm } from "@/features/app-settings/components/opening-times-form";
import { ProviderTabs } from "@/features/app-settings/components/provider-tabs";
import { ThemeForm } from "@/features/app-settings/components/theme-form";
import { CurrencyManager } from "@/features/currency/components/currency-manager";
import { LanguageManager } from "@/features/language/components/language-manager";
import { AnalyticsManager } from "@/features/analytics/components/analytics-manager";
import { RolePermissionManager } from "@/features/role-permission/components/role-permission-manager";

type SectionKey =
  | "company"
  | "site"
  | "opening_times"
  | "reservation"
  | "mail"
  | "order"
  | "cookies"
  | "theme"
  | "payment"
  | "currencies"
  | "languages"
  | "analytics"
  | "roles";

const SECTIONS: { key: SectionKey; i18n: string; label: string; icon: typeof Building2 }[] = [
  { key: "company", i18n: "settings.company", label: "Business Info", icon: Building2 },
  { key: "site", i18n: "settings.site", label: "System", icon: SlidersHorizontal },
  { key: "opening_times", i18n: "settings.opening_times", label: "Opening Times", icon: Clock },
  {
    key: "reservation",
    i18n: "settings.reservation",
    label: "Reservation Time",
    icon: CalendarClock,
  },
  { key: "mail", i18n: "settings.mail", label: "Mail", icon: Mail },
  { key: "order", i18n: "settings.order", label: "Order Setup", icon: ShoppingCart },
  { key: "cookies", i18n: "settings.cookies", label: "Cookies", icon: Cookie },
  { key: "analytics", i18n: "settings.analytics", label: "Analytics", icon: BarChart3 },
  { key: "theme", i18n: "settings.theme", label: "Branding", icon: Palette },
  { key: "payment", i18n: "settings.payment", label: "Payment Gateway", icon: CreditCard },
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
          {active === "analytics" && <AnalyticsManager />}
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
          {active === "payment" && (
            <ProviderTabs
              tabs={[
                {
                  key: "stripe",
                  label: "Stripe",
                  group: "payment_stripe",
                  fields: [
                    { key: "enabled", label: "Enabled", type: "toggle" },
                    {
                      key: "mode",
                      label: "Mode",
                      type: "select",
                      options: [
                        { value: "test", label: "Test" },
                        { value: "live", label: "Live" },
                      ],
                    },
                    { key: "publishable_key", label: "Publishable Key" },
                    { key: "secret_key", label: "Secret Key", type: "password" },
                  ],
                },
                {
                  key: "paypal",
                  label: "PayPal",
                  group: "payment_paypal",
                  fields: [
                    { key: "enabled", label: "Enabled", type: "toggle" },
                    {
                      key: "mode",
                      label: "Mode",
                      type: "select",
                      options: [
                        { value: "sandbox", label: "Sandbox" },
                        { value: "live", label: "Live" },
                      ],
                    },
                    { key: "client_id", label: "Client ID" },
                    { key: "client_secret", label: "Client Secret", type: "password" },
                  ],
                },
                {
                  key: "razorpay",
                  label: "Razorpay",
                  group: "payment_razorpay",
                  fields: [
                    { key: "enabled", label: "Enabled", type: "toggle" },
                    { key: "key_id", label: "Key ID" },
                    { key: "key_secret", label: "Key Secret", type: "password" },
                  ],
                },
                {
                  key: "cod",
                  label: "Cash on Delivery",
                  group: "payment_cod",
                  fields: [
                    { key: "enabled", label: "Enabled", type: "toggle" },
                    { key: "instructions", label: "Instructions", type: "textarea" },
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
