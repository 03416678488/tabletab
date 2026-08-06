import { httpClient } from "@/lib/httpClient";
import type {
  AppNotification,
  ListNotificationsParams,
  Paginated,
} from "@/features/notifications/types/notification.types";

const BASE = "/notifications";

export const notificationService = {
  list(params?: ListNotificationsParams) {
    return httpClient
      .get<Paginated<AppNotification>>(BASE, {
        auth: true,
        params: {
          page: params?.page,
          perPage: params?.perPage,
          category: params?.category,
          status: params?.status,
        },
      })
      .then((r) => r.data);
  },

  unreadCount() {
    return httpClient
      .get<{ count: number }>(`${BASE}/unread-count`, { auth: true })
      .then((r) => r.data.count);
  },

  markRead(id: string) {
    return httpClient
      .patch<{ success: true }>(`${BASE}/${id}/read`, undefined, { auth: true })
      .then((r) => r.data);
  },

  markAllRead() {
    return httpClient
      .patch<{ success: true }>(`${BASE}/read-all`, undefined, { auth: true })
      .then((r) => r.data);
  },

  markCategoryRead(category: string) {
    return httpClient
      .patch<{ success: true }>(`${BASE}/read-category/${category}`, undefined, { auth: true })
      .then((r) => r.data);
  },
};
