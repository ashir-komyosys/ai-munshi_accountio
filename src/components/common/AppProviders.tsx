"use client";

import React, { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { useUIStore } from "@/stores/uiStore";
import { seedDemoDatabaseIfEmpty } from "@/database/seed";

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 30,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  const locale = useUIStore((s) => s.locale);
  const theme = useUIStore((s) => s.theme);
  const [dbReady, setDbReady] = useState(false);

  // Sync HTML lang & dir for English / Urdu RTL
  useEffect(() => {
    const html = document.documentElement;
    html.lang = locale;
    html.dir = locale === "ur" ? "rtl" : "ltr";
  }, [locale]);

  // Sync light / dark / system theme
  useEffect(() => {
    const html = document.documentElement;
    const applyTheme = (mode: "light" | "dark") => {
      if (mode === "dark") html.classList.add("dark");
      else html.classList.remove("dark");
    };

    if (theme === "system") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      applyTheme(mq.matches ? "dark" : "light");
      const listener = (e: MediaQueryListEvent) => applyTheme(e.matches ? "dark" : "light");
      mq.addEventListener("change", listener);
      return () => mq.removeEventListener("change", listener);
    }
    applyTheme(theme);
  }, [theme]);

  // Ensure deterministic IndexedDB seed data is populated once on startup
  useEffect(() => {
    let active = true;
    seedDemoDatabaseIfEmpty()
      .catch((err) => console.error("Failed to seed demo DB:", err))
      .finally(() => {
        if (active) setDbReady(true);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {dbReady ? (
        children
      ) : (
        <div className="min-h-screen flex items-center justify-center bg-[var(--bg-app)]">
          <div className="flex flex-col items-center gap-3">
            <div className="h-9 w-9 rounded-full border-3 border-[var(--brand-primary)] border-t-transparent animate-spin" />
            <p className="text-sm font-medium text-[var(--text-secondary)]">
              Loading Accountio AI Demo Workspace...
            </p>
          </div>
        </div>
      )}
      <Toaster richColors position="top-right" />
    </QueryClientProvider>
  );
}
