export type EventStatus = "requested" | "confirmed" | "completed" | "cancelled";
export type EventSource = "online" | "phone" | "walk-in";

export interface EventType {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  basePrice: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EventBooking {
  id: string;
  eventTypeId: string | null;
  branchId: string | null;
  title: string;
  date: string;
  startTime: string;
  endTime: string | null;
  guestCount: number;
  guestName: string;
  guestPhone: string;
  guestEmail: string | null;
  budget: string | null;
  specialRequests: string | null;
  status: EventStatus;
  cancellationReason: string | null;
  source: EventSource;
  createdAt: string;
  confirmedAt: string | null;
  completedAt: string | null;
  /** Agreed payment collected from the guest (0 = none). */
  paymentAmount?: number;
  paymentMethod?: "cash" | "card" | "mfs" | "other" | null;
  paymentCollectedAt?: string | null;
  branch?: { id: string; name: string } | null;
  eventType?: { id: string; name: string } | null;
}

export interface Paginated<T> {
  items: T[];
  meta: {
    itemsPerPage: number;
    totalItems: number;
    currentPage: number;
    totalPages: number;
  };
  links: Record<string, string>;
}

export interface CreateEventTypeInput {
  name: string;
  description?: string;
  imageUrl?: string;
  basePrice?: string;
  sortOrder?: number;
  isActive?: boolean;
}
export type UpdateEventTypeInput = Partial<CreateEventTypeInput>;

export interface ListEventTypesParams {
  page?: number;
  perPage?: number;
  search?: string;
  isActive?: boolean;
}

export interface CreateEventInput {
  eventTypeId?: string;
  branchId?: string;
  title: string;
  date: string;
  startTime: string;
  endTime?: string;
  guestCount: number;
  guestName: string;
  guestPhone: string;
  guestEmail?: string;
  budget?: string;
  specialRequests?: string;
  source?: EventSource;
}

export interface ListEventsParams {
  page?: number;
  perPage?: number;
  search?: string;
  branchId?: string;
  eventTypeId?: string;
  date?: string;
  status?: EventStatus;
}
