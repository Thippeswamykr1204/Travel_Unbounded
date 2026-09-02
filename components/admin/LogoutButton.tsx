"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export default function LogoutButton() {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } finally {
      router.push("/admin/login");
      router.refresh();
    }
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loggingOut}
      className={cn(
        "rounded-full border border-ink/15 px-4 py-2 font-sans text-sm font-medium text-ink transition-colors hover:border-terra hover:text-terra",
        loggingOut && "cursor-not-allowed opacity-60",
      )}
    >
      {loggingOut ? "Logging out…" : "Log out"}
    </button>
  );
}