'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type AuthUser = {
  email: string;
  name?: string;
};

type AuthState = {
  isReady: boolean;
  user: AuthUser | null;
  setReady: (isReady: boolean) => void;
  setUser: (user: AuthUser | null) => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isReady: false,
      user: null,
      setReady: (isReady) => set({ isReady }),
      setUser: (user) => set({ user }),
    }),
    {
      name: 'omnimind-auth',
      partialize: (state) => ({ user: state.user }),
    }
  )
);
