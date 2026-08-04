"use client";

import { useEffect } from "react";
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
  const form = useForm<T>({
    resolver: zodResolver(schema as never),
    defaultValues: schema.parse(config ?? {}) as DefaultValues<T>,
    mode: "onChange",
  });
  useEffect(() => {
    const sub = form.watch((values) => onChange(values as FieldValues));
    return () => sub.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.watch]);
  return form as unknown as UseFormReturn<T>;
}
