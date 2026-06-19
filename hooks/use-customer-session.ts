"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { api } from "@/lib/api";
import type { Address, CustomerAccount } from "@/lib/types";

interface CustomerSessionStore {
  user: CustomerAccount | null;
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

export const useCustomerSession = create<CustomerSessionStore>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const account = await api.loginCustomer(email, password);
          if (!account) {
            return { ok: false, error: "Invalid email or password." };
          }
          set({ user: account, isAuthenticated: true });
          return { ok: true };
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
          const account = await api.signupCustomer(data);
          set({ user: account, isAuthenticated: true });
          return { ok: true };
        } finally {
          set({ isLoading: false });
        }
      },

      logout: () => set({ user: null, isAuthenticated: false }),

      refreshAccount: async () => {
        const account = await api.getCustomerAccount();
        if (get().isAuthenticated) {
          set({ user: account });
        }
      },

      updateProfile: async (data) => {
        const account = await api.updateCustomerProfile(data);
        set({ user: account });
      },

      addAddress: async (address) => {
        const account = await api.addAddress(address);
        set({ user: account });
      },

      updateAddress: async (addressId, patch) => {
        const account = await api.updateAddress(addressId, patch);
        set({ user: account });
      },

      deleteAddress: async (addressId) => {
        const account = await api.deleteAddress(addressId);
        set({ user: account });
      },
    }),
    {
      name: "tabletap-customer",
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
