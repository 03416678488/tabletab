import { httpClient } from "@/lib/httpClient";
import { EVENT_TYPE_ENDPOINTS } from "@/features/event/constants/event.constants";
import type {
  CreateEventTypeInput,
  EventType,
  ListEventTypesParams,
  Paginated,
  UpdateEventTypeInput,
} from "@/features/event/types/event.types";

export const eventTypeService = {
  list(params?: ListEventTypesParams) {
    return httpClient
      .get<Paginated<EventType>>(EVENT_TYPE_ENDPOINTS.base, {
        auth: true,
        params: {
          page: params?.page,
          perPage: params?.perPage,
          search: params?.search,
          isActive: params?.isActive,
        },
      })
      .then((res) => res.data);
  },

  create(body: CreateEventTypeInput) {
    return httpClient
      .post<EventType>(EVENT_TYPE_ENDPOINTS.base, body, { auth: true })
      .then((res) => res.data);
  },

  update(id: string, body: UpdateEventTypeInput) {
    return httpClient
      .put<EventType>(EVENT_TYPE_ENDPOINTS.byId(id), body, { auth: true })
      .then((res) => res.data);
  },

  remove(id: string) {
    return httpClient
      .delete<{ message: string }>(EVENT_TYPE_ENDPOINTS.byId(id), { auth: true })
      .then((res) => res.data);
  },
};
