import { type ReactNode } from "react";
import Link from "next/link";
import Container from "@/components/ui/Container";
import LogoutButton from "@/components/admin/LogoutButton";
import { cn } from "@/lib/utils";

type AdminShellProps = {
  children: ReactNode;
  activeNav: "dashboard" | "enquiries" | "destinations";
};

const NAV_ITEMS = [
  { key: "dashboard", href: "/admin/dashboard", label: "Dashboard" },
  { key: "enquiries", href: "/admin/enquiries", label: "Enquiries" },
  { key: "destinations", href: "/admin/destinations", label: "Destinations" },
] as const;

export default function AdminShell({ children, activeNav }: AdminShellProps) {
  return (
    <div className="min-h-screen bg-paper">
      {/* Top bar (mobile: full nav; desktop: wordmark + logout only) */}
      <header className="sticky top-0 z-40 border-b border-ink/10 bg-paper/95 backdrop-blur">
        <Container className="flex h-16 items-center justify-between">
          <Link href="/admin/dashboard" className="font-display text-base font-semibold text-ink">
            Travel Unbounded
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                className={cn(
                  "rounded-full px-4 py-2 font-sans text-sm font-medium transition-colors",
                  activeNav === item.key
                    ? "bg-terra/10 text-terra"
                    : "text-ink/70 hover:text-ink",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <LogoutButton />
          </div>
        </Container>

        {/* Mobile nav row */}
        <nav className="flex items-center gap-1 overflow-x-auto border-t border-ink/10 px-5 py-2 md:hidden">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className={cn(
                "shrink-0 rounded-full px-4 py-2 font-sans text-sm font-medium transition-colors",
                activeNav === item.key
                  ? "bg-terra/10 text-terra"
                  : "text-ink/70 hover:text-ink",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>

      <main>
        <Container className="py-8 sm:py-12">{children}</Container>
      </main>
    </div>
  );
}