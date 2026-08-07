import type { CustomerAccount } from "@/lib/types";
import { resolveApiBaseUrl } from "@/lib/api-base";

interface ApiCustomer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
}
interface AuthResponse {
  customer: ApiCustomer;
  token: string;
}

/** Unwrap the API's `{ _metaData, data }` envelope. */
function unwrap<T>(json: unknown): T {
  const j = json as { data?: T } | T;
  return (j && typeof j === "object" && "data" in (j as object) ? (j as { data: T }).data : j) as T;
}

function errorMessage(json: unknown, fallback: string): string {
  const j = json as { message?: string; _metaData?: { message?: string } } | undefined;
  return j?.message ?? j?._metaData?.message ?? fallback;
}

async function request<T>(path: string, init: RequestInit, fallbackErr: string): Promise<T> {
  const res = await fetch(`${resolveApiBaseUrl()}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init.headers ?? {}) },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(errorMessage(json, fallbackErr));
  return unwrap<T>(json);
}

/** The backend customer has a single address; the storefront keeps a local book. */
function toAccount(c: ApiCustomer): CustomerAccount {
  return { id: c.id, name: c.name, email: c.email ?? "", phone: c.phone ?? "", addresses: [] };
}

export interface CustomerAuth {
  account: CustomerAccount;
  token: string;
}

export async function apiRegister(data: {
  name: string;
  email: string;
  phone: string;
  password: string;
}): Promise<CustomerAuth> {
  const r = await request<AuthResponse>(
    "/customer-auth/register",
    { method: "POST", body: JSON.stringify(data) },
    "Could not create account",
  );
  return { account: toAccount(r.customer), token: r.token };
}

export async function apiLogin(email: string, password: string): Promise<CustomerAuth> {
  const r = await request<AuthResponse>(
    "/customer-auth/login",
    { method: "POST", body: JSON.stringify({ email, password }) },
    "Invalid email or password",
  );
  return { account: toAccount(r.customer), token: r.token };
}

export async function apiMe(token: string): Promise<CustomerAccount> {
  const c = await request<ApiCustomer>(
    "/customer-auth/me",
    { method: "GET", headers: { Authorization: `Bearer ${token}` } },
    "Session expired",
  );
  return toAccount(c);
}

export async function apiUpdateProfile(
  token: string,
  data: { name?: string; phone?: string },
): Promise<CustomerAccount> {
  const c = await request<ApiCustomer>(
    "/customer-auth/me",
    { method: "PUT", headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(data) },
    "Could not update profile",
  );
  return toAccount(c);
}
