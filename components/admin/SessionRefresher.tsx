"use client";

import { useEffect } from "react";

const REFRESH_INTERVAL_MS = 10 * 60 * 1000;

export default function SessionRefresher() {
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch("/api/auth/refresh", {
          method: "POST",
          credentials: "include",
        });
        if (!response.ok) {
          window.location.href = "/admin/login";
        }
      } catch {
        window.location.href = "/admin/login";
      }
    }, REFRESH_INTERVAL_MS);

    return () => clearInterval(interval);
  }, []);

  return null;
}