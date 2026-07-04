import type { TenantBranding } from "@/lib/types";

export const DEFAULT_BRANDING: TenantBranding = {
  primaryColor: "#0F766E",
  accentColor: "#F59E0B",
};

/** Runtime CSS tokens consumed by @theme inline in globals.css */
export const BRAND_TOKEN_KEYS = [
  "--brand",
  "--brand-foreground",
  "--brand-hover",
  "--brand-deep",
  "--brand-tint",
  "--accent",
  "--accent-foreground",
  "--accent-tint",
] as const;

export function isValidHex(hex: string | undefined): boolean {
  if (!hex) return false;
  const normalized = hex.trim();
  return /^#?[0-9a-fA-F]{6}$/.test(normalized);
}

export function normalizeHex(hex: string | undefined): string {
  if (!hex) return "";
  const trimmed = hex.trim();
  const withHash = trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
  if (!/^#[0-9a-fA-F]{6}$/.test(withHash)) return "";
  return withHash.toUpperCase();
}

/** Fill missing/invalid branding fields with product defaults. */
export function resolveBranding(raw?: Partial<TenantBranding> | null): TenantBranding {
  const primary =
    normalizeHex(raw?.primaryColor) || DEFAULT_BRANDING.primaryColor;
  const accent =
    normalizeHex(raw?.accentColor) || DEFAULT_BRANDING.accentColor || "#F59E0B";

  const logoDataUrl = raw?.logoDataUrl?.trim() || undefined;
  const logoUrl = raw?.logoUrl?.trim() || undefined;

  const resolved: TenantBranding = {
    primaryColor: primary,
    accentColor: accent,
  };

  if (logoDataUrl) {
    resolved.logoDataUrl = logoDataUrl;
  } else if (logoUrl) {
    resolved.logoUrl = logoUrl;
  }

  return resolved;
}

export function brandingKey(branding: Partial<TenantBranding> | undefined): string {
  return JSON.stringify(resolveBranding(branding));
}

function parseHex(hex: string): { r: number; g: number; b: number } | null {
  const normalized = normalizeHex(hex).replace("#", "");
  if (!normalized) return null;
  return {
    r: parseInt(normalized.slice(0, 2), 16),
    g: parseInt(normalized.slice(2, 4), 16),
    b: parseInt(normalized.slice(4, 6), 16),
  };
}

function toHex(r: number, g: number, b: number): string {
  const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
  return `#${[clamp(r), clamp(g), clamp(b)]
    .map((c) => c.toString(16).padStart(2, "0"))
    .join("")}`;
}

/** WCAG relative luminance (sRGB). */
export function relativeLuminance(hex: string): number {
  const rgb = parseHex(hex);
  if (!rgb) return 0;
  const channel = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(rgb.r) + 0.7152 * channel(rgb.g) + 0.0722 * channel(rgb.b);
}

/** Pick black or white text for readable contrast on a brand background. */
export function contrastForeground(hex: string): "#000000" | "#ffffff" {
  return relativeLuminance(hex) > 0.45 ? "#000000" : "#ffffff";
}

function mixHex(hex: string, target: "#000000" | "#ffffff", amount: number): string {
  const rgb = parseHex(hex);
  if (!rgb) return hex;
  const t = target === "#ffffff" ? { r: 255, g: 255, b: 255 } : { r: 0, g: 0, b: 0 };
  return toHex(
    rgb.r + (t.r - rgb.r) * amount,
    rgb.g + (t.g - rgb.g) * amount,
    rgb.b + (t.b - rgb.b) * amount,
  );
}

/** Maps tenant branding → runtime CSS tokens that @theme inline reads. */
export function brandingCssVars(branding: TenantBranding): Record<string, string> {
  const resolved = resolveBranding(branding);
  const primary = resolved.primaryColor;
  const accent = resolved.accentColor ?? DEFAULT_BRANDING.accentColor ?? "#F59E0B";
  const foreground = contrastForeground(primary);
  const accentForeground = contrastForeground(accent);

  return {
    "--brand": primary,
    "--brand-foreground": foreground,
    "--brand-hover": mixHex(primary, "#ffffff", 0.12),
    "--brand-deep": mixHex(primary, "#000000", 0.18),
    "--brand-tint": mixHex(primary, "#ffffff", 0.92),
    "--accent": accent,
    "--accent-foreground": accentForeground,
    "--accent-tint": mixHex(accent, "#ffffff", 0.9),
  };
}

export function applyBrandingVars(el: HTMLElement, branding: TenantBranding) {
  const vars = brandingCssVars(branding);
  for (const [key, value] of Object.entries(vars)) {
    el.style.setProperty(key, value);
  }
}

export function clearBrandingVars(el: HTMLElement) {
  for (const key of BRAND_TOKEN_KEYS) {
    el.style.removeProperty(key);
  }
}

const STYLE_TAG_ID = "tabletap-tenant-theme";

/** Inject / update a global style tag (most reliable with Tailwind v4 @theme inline). */
export function mountTenantTheme(branding: TenantBranding) {
  if (typeof document === "undefined") return;

  const resolved = resolveBranding(branding);
  const vars = brandingCssVars(resolved);
  const css = `html[data-tenant-theme] {\n${Object.entries(vars)
    .map(([key, value]) => `  ${key}: ${value};`)
    .join("\n")}\n}`;

  let styleEl = document.getElementById(STYLE_TAG_ID) as HTMLStyleElement | null;
  if (!styleEl) {
    styleEl = document.createElement("style");
    styleEl.id = STYLE_TAG_ID;
    document.head.appendChild(styleEl);
  }
  styleEl.textContent = css;

  document.documentElement.setAttribute("data-tenant-theme", "true");
  applyBrandingVars(document.documentElement, resolved);
}

export function unmountTenantTheme() {
  if (typeof document === "undefined") return;
  document.getElementById(STYLE_TAG_ID)?.remove();
  clearBrandingVars(document.documentElement);
  document.documentElement.removeAttribute("data-tenant-theme");
}
