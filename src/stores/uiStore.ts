"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Locale, ThemeMode, UserRole } from "@/types";

interface DemoSession {
  isAuthenticated: boolean;
  userName: string;
  userPhone: string;
  userEmail: string;
  role: UserRole;
  onboardingCompleted: boolean;
  whatsappConnected: boolean;
  sessionExpiresAt: string;
}

interface UIState {
  locale: Locale;
  theme: ThemeMode;
  sidebarCollapsed: boolean;
  mobileNavOpen: boolean;
  globalSearchOpen: boolean;
  munshiDrawerOpen: boolean;
  munshiContextPrompt: string | null;
  activeBookId: string;
  session: DemoSession;

  setLocale: (locale: Locale) => void;
  setTheme: (theme: ThemeMode) => void;
  toggleSidebar: () => void;
  setMobileNavOpen: (open: boolean) => void;
  setGlobalSearchOpen: (open: boolean) => void;
  openMunshiDrawer: (contextPrompt?: string) => void;
  closeMunshiDrawer: () => void;
  setActiveBookId: (bookId: string) => void;
  loginDemo: (partial?: Partial<DemoSession>) => void;
  completeOnboarding: () => void;
  setWhatsappConnected: (connected: boolean) => void;
  setRole: (role: UserRole) => void;
  logout: () => void;
}

const DEFAULT_BOOK_ID = "book_al_madina";

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      locale: "en",
      theme: "light",
      sidebarCollapsed: false,
      mobileNavOpen: false,
      globalSearchOpen: false,
      munshiDrawerOpen: false,
      munshiContextPrompt: null,
      activeBookId: DEFAULT_BOOK_ID,
      session: {
        isAuthenticated: true, // Ready in demo mode immediately; user can also test logout/login
        userName: "Haji Muhammad Ashir",
        userPhone: "+92 300 8664123",
        userEmail: "owner@almadinayarn.pk",
        role: "owner",
        onboardingCompleted: true,
        whatsappConnected: true,
        sessionExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      },

      setLocale: (locale) => set({ locale }),
      setTheme: (theme) => set({ theme }),
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setMobileNavOpen: (mobileNavOpen) => set({ mobileNavOpen }),
      setGlobalSearchOpen: (globalSearchOpen) => set({ globalSearchOpen }),
      openMunshiDrawer: (contextPrompt) =>
        set({ munshiDrawerOpen: true, munshiContextPrompt: contextPrompt ?? null }),
      closeMunshiDrawer: () => set({ munshiDrawerOpen: false, munshiContextPrompt: null }),
      setActiveBookId: (activeBookId) => set({ activeBookId }),
      loginDemo: (partial) =>
        set((s) => ({
          session: {
            ...s.session,
            ...partial,
            isAuthenticated: true,
            sessionExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          },
        })),
      completeOnboarding: () =>
        set((s) => ({
          session: { ...s.session, onboardingCompleted: true },
        })),
      setWhatsappConnected: (whatsappConnected) =>
        set((s) => ({
          session: { ...s.session, whatsappConnected },
        })),
      setRole: (role) =>
        set((s) => ({
          session: { ...s.session, role },
        })),
      logout: () =>
        set((s) => ({
          session: { ...s.session, isAuthenticated: false },
        })),
    }),
    {
      name: "accountio-ui-store",
      partialize: (state) => ({
        locale: state.locale,
        theme: state.theme,
        sidebarCollapsed: state.sidebarCollapsed,
        activeBookId: state.activeBookId,
        session: state.session,
      }),
    }
  )
);
