export type NotificationPriority = "low" | "normal" | "high" | "critical";

export interface AppNotification {
  id: string;
  category: string;
  type: string;
  title: string;
  body: string | null;
  data: Record<string, unknown> | null;
  priority: NotificationPriority;
  branchId: string | null;
  readAt: string | null;
  createdAt: string;
}

export interface Paginated<T> {
  items: T[];
  meta: {
    itemsPerPage: number;
    totalItems: number;
    currentPage: number;
    totalPages: number;
  };
}

export interface ListNotificationsParams {
  page?: number;
  perPage?: number;
  category?: string;
  status?: "unread" | "all";
}
