"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import Button from "@/components/ui/Button";

type NavLink = {
  href: string;
  label: string;
};

type MobileMenuProps = {
  open: boolean;
  onClose: () => void;
  links: NavLink[];
  pathname: string;
};

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';

export default function MobileMenu({
  open,
  onClose,
  links,
  pathname,
}: MobileMenuProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab") return;

      const panel = panelRef.current;
      if (!panel) return;

      const focusable = Array.from(
        panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      ).filter((el) => el.offsetParent !== null);

      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (event.shiftKey) {
        if (active === first || !panel.contains(active)) {
          event.preventDefault();
          last.focus();
        }
      } else {
        if (active === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
      previouslyFocused?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Site menu"
      className="fixed inset-0 z-[60] md:hidden"
    >
      <button
        type="button"
        aria-label="Close menu"
        onClick={onClose}
        className="absolute inset-0 h-full w-full bg-canvas-deep/60 backdrop-blur-sm"
      />

      <div
        ref={panelRef}
        className="animate-menu-in absolute inset-y-0 right-0 flex h-full w-[85%] max-w-sm flex-col overflow-y-auto bg-paper px-6 pb-10 pt-6 text-ink shadow-xl"
      >
        <div className="flex items-center justify-between">
          <span className="font-display text-sm font-semibold uppercase tracking-[0.2em]">
            Travel Unbounded
          </span>
          <button
            ref={closeButtonRef}
            type="button"
            aria-label="Close menu"
            onClick={onClose}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <line x1="4" y1="4" x2="20" y2="20" />
              <line x1="20" y1="4" x2="4" y2="20" />
            </svg>
          </button>
        </div>

        <nav className="mt-12 flex flex-1 flex-col gap-2">
          {links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={onClose}
                className={cnActive(isActive)}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <Button
          as="a"
          href="/contact"
          variant="primary"
          onClick={onClose}
          className="mt-auto w-full justify-center py-4 text-base"
        >
          Plan Your Trip
        </Button>
      </div>
    </div>
  );
}

function cnActive(isActive: boolean) {
  return [
    "flex min-h-[44px] items-center border-b border-sand font-display text-2xl",
    isActive ? "text-terra" : "text-ink",
  ].join(" ");
}