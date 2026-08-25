"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Container from "@/components/ui/Container";
import Button from "@/components/ui/Button";
import MobileMenu from "@/components/layout/MobileMenu";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

const SCROLL_THRESHOLD = 40;

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const closeMenu = useCallback(() => setMenuOpen(false), []);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > SCROLL_THRESHOLD);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-colors duration-300",
          scrolled
            ? "bg-paper/95 text-ink backdrop-blur shadow-sm"
            : "bg-transparent text-paper",
        )}
      >
        <Container className="flex h-16 items-center justify-between sm:h-20">
          <Link
            href="/"
            className="font-display text-sm font-semibold uppercase tracking-[0.2em] sm:text-base"
          >
            Travel Unbounded
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            {NAV_LINKS.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "text-sm font-medium underline-offset-4 transition-colors",
                    isActive
                      ? cn("underline", scrolled ? "text-terra" : "text-paper")
                      : "hover:underline",
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
            <Button as="a" href="/contact" variant="primary">
              Plan Your Trip
            </Button>
          </nav>

          <button
            type="button"
            aria-label="Open menu"
            onClick={() => setMenuOpen(true)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full md:hidden"
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        </Container>
      </header>

      <MobileMenu
        open={menuOpen}
        onClose={closeMenu}
        links={NAV_LINKS}
        pathname={pathname}
      />
    </>
  );
}