"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dropdown } from "@/components/ui/dropdown";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError, applyApiErrorToForm } from "@/lib/httpClient";

import { customQrSchema, type CustomQrFormValues } from "@/features/qr-code/schemas/qr-code.schema";
import { qrCodeService } from "@/features/qr-code/services/qr-code.service";
import { buildWifiPayload } from "@/features/qr-code/constants/qr-code.constants";
import type { QrCode, QrCustomType } from "@/features/qr-code/types/qr-code.types";

interface QrCodeFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The custom code being edited, or null to create a new one. */
  qrCode: QrCode | null;
  /** Branch a new custom code belongs to (from the topbar switcher). */
  branchId?: string;
  onSaved: () => void;
}

const TYPE_OPTIONS: { value: QrCustomType; label: string }[] = [
  { value: "url", label: "Website / Link" },
  { value: "review", label: "Google Review" },
  { value: "wifi", label: "WiFi Network" },
  { value: "text", label: "Plain Text" },
  { value: "phone", label: "Phone Number" },
  { value: "email", label: "Email Address" },
];

const VALUE_FIELD: Record<
  Exclude<QrCustomType, "wifi">,
  { label: string; placeholder: string; type: string }
> = {
  url: { label: "URL", placeholder: "https://example.com", type: "url" },
  review: {
    label: "Google review link",
    placeholder: "https://g.page/r/…/review",
    type: "url",
  },
  text: { label: "Text", placeholder: "Any text to encode", type: "text" },
  phone: { label: "Phone number", placeholder: "+92 300 1234567", type: "tel" },
  email: { label: "Email address", placeholder: "hello@example.com", type: "email" },
};

/** Strip a known URI scheme so editing shows the bare value. */
function stripScheme(content: string, scheme: string): string {
  return content.toLowerCase().startsWith(scheme) ? content.slice(scheme.length) : content;
}

/** Best-effort parse of a stored `WIFI:` payload back into form fields. */
function parseWifi(content: string): Partial<CustomQrFormValues> {
  const body = content.replace(/^WIFI:/i, "").replace(/;;$/, "");
  const map: Record<string, string> = {};
  body.split(/(?<!\\);/).forEach((seg) => {
    const idx = seg.indexOf(":");
    if (idx > 0) map[seg.slice(0, idx)] = seg.slice(idx + 1).replace(/\\([\\;,:"])/g, "$1");
  });
  return {
    ssid: map.S ?? "",
    password: map.P ?? "",
    encryption: (map.T as "WPA" | "WEP" | "nopass") || "WPA",
    hidden: map.H === "true",
  };
}

/** Turn a stored custom code into editable form defaults. */
function toDefaults(qr: QrCode | null): CustomQrFormValues {
  const base: CustomQrFormValues = {
    label: "",
    customType: "url",
    isActive: true,
    value: "",
    ssid: "",
    password: "",
    encryption: "WPA",
    hidden: false,
  };
  if (!qr) return base;
  const t = (qr.customType ?? "url") as QrCustomType;
  const content = qr.content ?? "";
  const filled: CustomQrFormValues = {
    ...base,
    label: qr.label ?? "",
    customType: t,
    isActive: qr.isActive,
  };
  if (t === "wifi") return { ...filled, ...parseWifi(content) };
  if (t === "phone") return { ...filled, value: stripScheme(content, "tel:") };
  if (t === "email") return { ...filled, value: stripScheme(content, "mailto:") };
  return { ...filled, value: content };
}

/** Assemble the exact string the QR will encode from the form values. */
function buildContent(values: CustomQrFormValues): string {
  const v = values.value.trim();
  switch (values.customType) {
    case "wifi":
      return buildWifiPayload({
        ssid: values.ssid.trim(),
        password: values.password,
        encryption: values.encryption,
        hidden: values.hidden,
      });
    case "phone":
      return `tel:${v.replace(/\s+/g, "")}`;
    case "email":
      return `mailto:${v}`;
    default:
      return v;
  }
}

export function QrCodeFormDialog({
  open,
  onOpenChange,
  qrCode,
  branchId,
  onSaved,
}: QrCodeFormDialogProps) {
  const isEdit = !!qrCode;

  const form = useForm<CustomQrFormValues>({
    resolver: zodResolver(customQrSchema),
    defaultValues: toDefaults(qrCode),
  });
  const {
    register,
    handleSubmit,
    reset,
    setError,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = form;

  useEffect(() => {
    if (open) reset(toDefaults(qrCode));
  }, [open, qrCode, reset]);

  const customType = watch("customType");

  const onSubmit = handleSubmit(async (values) => {
    const content = buildContent(values);
    try {
      if (isEdit) {
        await qrCodeService.update(qrCode!.id, {
          label: values.label.trim(),
          customType: values.customType,
          content,
          isActive: values.isActive,
        });
      } else {
        await qrCodeService.create({
          kind: "custom",
          label: values.label.trim(),
          customType: values.customType,
          content,
          isActive: values.isActive,
          ...(branchId ? { branchId } : {}),
        });
      }
      onOpenChange(false);
      onSaved();
    } catch (err) {
      applyApiErrorToForm(err, setError, "label", ["label"]);
      if (!(err instanceof ApiError)) {
      }
    }
  });

  const valueField = customType !== "wifi" ? VALUE_FIELD[customType] : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit QR code" : "Create QR code"}</DialogTitle>
          <DialogDescription>
            Encode a link, Google review, WiFi network, or any text into a scannable code.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label required>Name</Label>
            <Input placeholder="e.g. Guest WiFi" {...register("label")} />
            {errors.label && <p className="text-xs text-destructive">{errors.label.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label required>Type</Label>
            <Dropdown
              value={customType}
              onChange={(v) =>
                setValue("customType", v as QrCustomType, {
                  shouldDirty: true,
                  shouldValidate: false,
                })
              }
              aria-label="QR code type"
              options={TYPE_OPTIONS}
            />
          </div>

          {valueField ? (
            <div className="space-y-1.5">
              <Label required>{valueField.label}</Label>
              <Input
                type={valueField.type}
                inputMode={customType === "phone" ? "tel" : undefined}
                placeholder={valueField.placeholder}
                {...register("value")}
              />
              {errors.value && <p className="text-xs text-destructive">{errors.value.message}</p>}
            </div>
          ) : (
            <>
              <div className="space-y-1.5">
                <Label required>Network name (SSID)</Label>
                <Input placeholder="MyRestaurant-Guest" {...register("ssid")} />
                {errors.ssid && <p className="text-xs text-destructive">{errors.ssid.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Security</Label>
                  <Dropdown
                    value={watch("encryption")}
                    onChange={(v) =>
                      setValue("encryption", v as "WPA" | "WEP" | "nopass", { shouldDirty: true })
                    }
                    aria-label="WiFi security"
                    options={[
                      { value: "WPA", label: "WPA/WPA2" },
                      { value: "WEP", label: "WEP" },
                      { value: "nopass", label: "None" },
                    ]}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label required>Password</Label>
                  <Input
                    type="text"
                    placeholder="••••••••"
                    disabled={watch("encryption") === "nopass"}
                    {...register("password")}
                  />
                  {errors.password && (
                    <p className="text-xs text-destructive">{errors.password.message}</p>
                  )}
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-ink">
                <input
                  type="checkbox"
                  className="size-4 rounded border-border accent-brand"
                  {...register("hidden")}
                />
                Hidden network
              </label>
            </>
          )}

          <label className="flex items-center gap-2 pt-1 text-sm text-ink">
            <input
              type="checkbox"
              className="size-4 rounded border-border accent-brand"
              {...register("isActive")}
            />
            Active
          </label>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="animate-spin" />}
              {isEdit ? "Save changes" : "Create QR code"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
