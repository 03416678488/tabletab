import { httpClient } from "@/lib/httpClient";
import { EVENT_ENDPOINTS } from "@/features/event/constants/event.constants";
import type {
  CreateEventInput,
  EventBooking,
  EventStatus,
  ListEventsParams,
  Paginated,
} from "@/features/event/types/event.types";

export const eventService = {
  list(params?: ListEventsParams) {
    return httpClient
      .get<Paginated<EventBooking>>(EVENT_ENDPOINTS.base, {
        auth: true,
        params: {
          page: params?.page,
          perPage: params?.perPage,
          search: params?.search,
          branchId: params?.branchId,
          eventTypeId: params?.eventTypeId,
          date: params?.date,
          status: params?.status,
        },
      })
      .then((res) => res.data);
  },

  /** Staff — create a booking directly (phone / walk-in / manual entry). */
  create(body: CreateEventInput) {
    return httpClient
      .post<EventBooking>(EVENT_ENDPOINTS.base, body, { auth: true })
      .then((res) => res.data);
  },

  setStatus(id: string, status: EventStatus, cancellationReason?: string) {
    return httpClient
      .put<EventBooking>(
        EVENT_ENDPOINTS.byId(id),
        { status, ...(cancellationReason ? { cancellationReason } : {}) },
        { auth: true },
      )
      .then((res) => res.data);
  },

  /** Staff — record an event payment (advance/package). Posts an earning txn. */
  recordPayment(
    id: string,
    paymentAmount: number,
    paymentMethod: "cash" | "card" | "mfs" | "other",
  ) {
    return httpClient
      .put<EventBooking>(EVENT_ENDPOINTS.byId(id), { paymentAmount, paymentMethod }, { auth: true })
      .then((res) => res.data);
  },

  remove(id: string) {
    return httpClient
      .delete<{ message: string }>(EVENT_ENDPOINTS.byId(id), { auth: true })
      .then((res) => res.data);
  },
};

/** Public — submit an event inquiry from the storefront (no account required). */
export function submitEventInquiry(body: CreateEventInput): Promise<EventBooking> {
  return httpClient.post<EventBooking>(EVENT_ENDPOINTS.base, body).then((res) => res.data);
}

/** Public — the guest's confirmation page. */
export async function fetchEventBooking(id: string): Promise<EventBooking | null> {
  try {
    const res = await httpClient.get<EventBooking>(EVENT_ENDPOINTS.byId(id));
    return res.data;
  } catch {
    return null;
  }
}

/** Public — list the active bookable event types for the storefront. */
export function fetchPublicEventTypes(): Promise<{
  items: Array<{
    id: string;
    name: string;
    description: string | null;
    imageUrl: string | null;
    basePrice: string | null;
  }>;
}> {
  return httpClient
    .get<{
      items: Array<{
        id: string;
        name: string;
        description: string | null;
        imageUrl: string | null;
        basePrice: string | null;
      }>;
    }>("/event-types", { params: { isActive: true, perPage: 100 } })
    .then((res) => res.data);
}
