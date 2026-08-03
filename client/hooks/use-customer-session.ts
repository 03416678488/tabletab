"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  apiLogin,
  apiMe,
  apiRegister,
  apiUpdateProfile,
} from "@/features/storefront/services/customer-auth";
import type { Address, CustomerAccount } from "@/lib/types";

interface CustomerSessionStore {
  user: CustomerAccount | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  signup: (data: {
    name: string;
    email: string;
    phone: string;
    password: string;
  }) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
  refreshAccount: () => Promise<void>;
  updateProfile: (data: { name: string; phone: string }) => Promise<void>;
  addAddress: (address: Omit<Address, "id">) => Promise<void>;
  updateAddress: (addressId: string, patch: Partial<Omit<Address, "id">>) => Promise<void>;
  deleteAddress: (addressId: string) => Promise<void>;
}

const newId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `addr-${Date.now()}`;

/** Merge new addresses into the current user, keeping a single default. */
function withAddresses(user: CustomerAccount, addresses: Address[]): CustomerAccount {
  return { ...user, addresses };
}

export const useCustomerSession = create<CustomerSessionStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const { account, token } = await apiLogin(email, password);
          // Preserve any locally-saved addresses across a re-login.
          const prev = get().user?.addresses ?? [];
          set({ user: withAddresses(account, prev), token, isAuthenticated: true });
          return { ok: true };
        } catch (e) {
          return { ok: false, error: e instanceof Error ? e.message : "Login failed." };
        } finally {
          set({ isLoading: false });
        }
      },

      signup: async (data) => {
        if (!data.name.trim() || !data.email.trim() || !data.password) {
          return { ok: false, error: "Please fill in all required fields." };
        }
        if (data.password.length < 6) {
          return { ok: false, error: "Password must be at least 6 characters." };
        }
        set({ isLoading: true });
        try {
          const { account, token } = await apiRegister(data);
          set({ user: account, token, isAuthenticated: true });
          return { ok: true };
        } catch (e) {
          return { ok: false, error: e instanceof Error ? e.message : "Sign up failed." };
        } finally {
          set({ isLoading: false });
        }
      },

      logout: () => set({ user: null, token: null, isAuthenticated: false }),

      refreshAccount: async () => {
        const token = get().token;
        if (!token) return;
        try {
          const account = await apiMe(token);
          const prev = get().user?.addresses ?? [];
          if (get().isAuthenticated) set({ user: withAddresses(account, prev) });
        } catch {
          // Token invalid/expired — sign out silently.
          set({ user: null, token: null, isAuthenticated: false });
        }
      },

      updateProfile: async (data) => {
        const { token, user } = get();
        if (!token || !user) return;
        const account = await apiUpdateProfile(token, data);
        set({ user: withAddresses(account, user.addresses) });
      },

      // Addresses are a local convenience (the delivery address is sent on the
      // order as text). They persist in this store, not on the backend.
      addAddress: async (address) => {
        const user = get().user;
        if (!user) return;
        const entry: Address = { ...address, id: newId() };
        const addresses = entry.isDefault
          ? [...user.addresses.map((a) => ({ ...a, isDefault: false })), entry]
          : [...user.addresses, { ...entry, isDefault: user.addresses.length === 0 }];
        set({ user: withAddresses(user, addresses) });
      },

      updateAddress: async (addressId, patch) => {
        const user = get().user;
        if (!user) return;
        const addresses = user.addresses.map((a) =>
          a.id === addressId ? { ...a, ...patch } : patch.isDefault ? { ...a, isDefault: false } : a,
        );
        set({ user: withAddresses(user, addresses) });
      },

      deleteAddress: async (addressId) => {
        const user = get().user;
        if (!user) return;
        set({ user: withAddresses(user, user.addresses.filter((a) => a.id !== addressId)) });
      },
    }),
    {
      name: "tabletap-customer",
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
