import { httpClient } from "@/lib/httpClient";

/** { field: { locale: value } } */
export type EntityTranslations = Record<string, Record<string, string>>;

export interface TranslationItem {
  field: string;
  locale: string;
  value: string;
}

export const translationService = {
  getFor(entity: string, entityId: string | number) {
    return httpClient
      .get<EntityTranslations>("/translations", {
        auth: true,
        params: { entity, entityId: String(entityId) },
      })
      .then((r) => r.data);
  },
  save(entity: string, entityId: string | number, items: TranslationItem[]) {
    return httpClient
      .put<{ message: string }>(
        "/translations",
        { entity, entityId: String(entityId), items },
        { auth: true },
      )
      .then((r) => r.data);
  },
};
