"use client";

import { useUIStore } from "@/stores/uiStore";
import { dictionaries } from "@/i18n/dictionaries";

export function useDictionary() {
  const locale = useUIStore((s) => s.locale);
  return {
    locale,
    isRtl: locale === "ur",
    t: dictionaries[locale],
  };
}
