"use client";

import { useState, useEffect } from "react";

export function useDashboardTheme(): "dark" | "light" {
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const attr = document.documentElement.getAttribute("data-theme") as "dark" | "light" | null;
    if (attr) setTheme(attr);

    const observer = new MutationObserver(() => {
      const current = document.documentElement.getAttribute("data-theme") as "dark" | "light" | null;
      if (current) setTheme(current);
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

  return theme;
}
