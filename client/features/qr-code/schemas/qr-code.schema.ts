import { z } from "zod";

export const CUSTOM_QR_TYPES = ["url", "review", "wifi", "text", "phone", "email"] as const;

/** A single form covering every custom-QR type; fields validate per `customType`. */
export const customQrSchema = z
  .object({
    label: z.string().trim().min(1, "Give this code a name"),
    customType: z.enum(CUSTOM_QR_TYPES),
    isActive: z.boolean(),
    // Single-value types (url / review / text / phone / email). Always present
    // via the form's defaultValues, so kept required to keep input === output.
    value: z.string(),
    // WiFi fields.
    ssid: z.string(),
    password: z.string(),
    encryption: z.enum(["WPA", "WEP", "nopass"]),
    hidden: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (data.customType === "wifi") {
      if (!data.ssid.trim()) {
        ctx.addIssue({ code: "custom", path: ["ssid"], message: "Network name is required" });
      }
      if (data.encryption !== "nopass" && !data.password) {
        ctx.addIssue({ code: "custom", path: ["password"], message: "Password is required" });
      }
      return;
    }
    if (!data.value.trim()) {
      ctx.addIssue({ code: "custom", path: ["value"], message: "This field is required" });
      return;
    }
    if (
      (data.customType === "url" || data.customType === "review") &&
      !/^https?:\/\//i.test(data.value.trim())
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["value"],
        message: "Enter a full URL starting with http:// or https://",
      });
    }
    if (data.customType === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.value.trim())) {
      ctx.addIssue({ code: "custom", path: ["value"], message: "Enter a valid email address" });
    }
  });

export type CustomQrFormValues = z.infer<typeof customQrSchema>;
