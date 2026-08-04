import { httpClient } from "@/lib/httpClient";

export interface Language {
  id: number;
  name: string;
  code: string;
  isActive: boolean;
  isDefault: boolean;
}

export interface LanguageInput {
  name: string;
  code: string;
  isActive?: boolean;
  isDefault?: boolean;
}

export const languageService = {
  list() {
    return httpClient.get<Language[]>("/languages").then((r) => r.data);
  },
  create(body: LanguageInput) {
    return httpClient.post<Language>("/languages", body, { auth: true }).then((r) => r.data);
  },
  update(id: number, body: Partial<LanguageInput>) {
    return httpClient.put<Language>(`/languages/${id}`, body, { auth: true }).then((r) => r.data);
  },
  remove(id: number) {
    return httpClient
      .delete<{ message: string }>(`/languages/${id}`, { auth: true })
      .then((r) => r.data);
  },
};
