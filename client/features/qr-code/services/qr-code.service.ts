import { httpClient } from "@/lib/httpClient";
import { QR_CODE_ENDPOINTS } from "@/features/qr-code/constants/qr-code.constants";
import type {
  CreateQrCodeInput,
  ListQrCodesParams,
  Paginated,
  QrCode,
  UpdateQrCodeInput,
} from "@/features/qr-code/types/qr-code.types";

export const qrCodeService = {
  list(params?: ListQrCodesParams) {
    return httpClient
      .get<Paginated<QrCode>>(QR_CODE_ENDPOINTS.base, {
        auth: true,
        params: {
          page: params?.page,
          perPage: params?.perPage,
          search: params?.search,
          tableId: params?.tableId,
          areaId: params?.areaId,
          branchId: params?.branchId,
          isActive: params?.isActive,
        },
      })
      .then((res) => res.data);
  },

  create(body: CreateQrCodeInput) {
    return httpClient
      .post<QrCode>(QR_CODE_ENDPOINTS.base, body, { auth: true })
      .then((res) => res.data);
  },

  update(id: string, body: UpdateQrCodeInput) {
    return httpClient
      .put<QrCode>(QR_CODE_ENDPOINTS.byId(id), body, { auth: true })
      .then((res) => res.data);
  },

  remove(id: string) {
    return httpClient
      .delete<{ message: string }>(QR_CODE_ENDPOINTS.byId(id), { auth: true })
      .then((res) => res.data);
  },
};
