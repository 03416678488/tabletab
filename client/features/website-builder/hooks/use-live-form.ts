"use client";

import { useEffect, useState } from "react";
import {
  type DefaultValues,
  type FieldValues,
  type UseFormReturn,
  useForm,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";

/**
 * RHF form bound to a zod schema that pushes every change up to `onChange`.
 * Defaults are filled by parsing the incoming config, so partial data is safe.
 *
 * The return is cast to the 2-arg `UseFormReturn` so the resolver's transformed-
 * values generic doesn't leak into `Control` and break field-component props.
 */
export function useLiveForm<T extends FieldValues>(
  schema: z.ZodType<T>,
  config: unknown,
  onChange: (c: FieldValues) => void,
): UseFormReturn<T> {
  // Parse the incoming config once, on mount, to fill defaults. A lazy state
  // initializer keeps this from re-running every render — re-parsing mid-edit
  // would throw on transient invalid state (e.g. a freshly added slide whose
  // required image URL is still blank). `safeParse` never throws; on the rare
  // invalid mount we fall back to the raw config so the user's values persist.
  // Switching blocks remounts the form (keyed by block id in ConfigPanel), so a
  // different block's config is still picked up. The resolver keeps validating
  // on change, so field errors like "Image URL is required" still surface.
  const [defaultValues] = useState<DefaultValues<T>>(() => {
    const parsed = schema.safeParse(config ?? {});
    return (parsed.success ? parsed.data : (config ?? {})) as DefaultValues<T>;
  });
  const form = useForm<T>({
    resolver: zodResolver(schema as never),
    defaultValues,
    mode: "onChange",
  });
  useEffect(() => {
    const sub = form.watch((values) => onChange(values as FieldValues));
    return () => sub.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.watch]);
  return form as unknown as UseFormReturn<T>;
}
