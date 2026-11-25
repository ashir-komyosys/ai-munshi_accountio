"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUIStore } from "@/stores/uiStore";

export default function HomePage() {
  const router = useRouter();
  const isAuthenticated = useUIStore((s) => s.session.isAuthenticated);

  useEffect(() => {
    router.replace(isAuthenticated ? "/app/overview" : "/login");
  }, [isAuthenticated, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-app)]">
      <div className="h-8 w-8 rounded-full border-3 border-[var(--brand-primary)] border-t-transparent animate-spin" />
    </div>
  );
}
