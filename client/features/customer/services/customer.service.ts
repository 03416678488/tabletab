import { httpClient } from "@/lib/httpClient";
import { CUSTOMER_ENDPOINTS } from "@/features/customer/constants/customer.constants";
import type {
  CreateCustomerInput,
  Customer,
  ListCustomersParams,
  Paginated,
  UpdateCustomerInput,
} from "@/features/customer/types/customer.types";

export const customerService = {
  list(params?: ListCustomersParams) {
    return httpClient
      .get<Paginated<Customer>>(CUSTOMER_ENDPOINTS.base, {
        auth: true,
        params: {
          page: params?.page,
          perPage: params?.perPage,
          search: params?.search,
        },
      })
      .then((res) => res.data);
  },

  create(body: CreateCustomerInput) {
    return httpClient
      .post<Customer>(CUSTOMER_ENDPOINTS.base, body, { auth: true })
      .then((res) => res.data);
  },

  update(id: string, body: UpdateCustomerInput) {
    return httpClient
      .put<Customer>(CUSTOMER_ENDPOINTS.byId(id), body, { auth: true })
      .then((res) => res.data);
  },

  remove(id: string) {
    return httpClient
      .delete<{ message: string }>(CUSTOMER_ENDPOINTS.byId(id), { auth: true })
      .then((res) => res.data);
  },
};
