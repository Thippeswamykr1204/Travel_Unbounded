"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { COUNTRY_CODES, countryFlagUrl } from "@/lib/countryCodes";

const fieldStyles =
  "w-full appearance-none rounded-md border border-ink/15 bg-paper px-4 py-3 font-sans text-sm text-ink placeholder:text-ink/40 outline-none focus-visible:outline-none focus:border-2 focus:border-terra focus:px-[15px] focus:py-[11px] hover:border-ink/15";

type CountryCodeSelectProps = {
  value: string;
  onChange: (dialCode: string) => void;
  onBlur?: () => void;
  id?: string;
  hasError?: boolean;
};

export default function CountryCodeSelect({
  value,
  onChange,
  onBlur,
  id = "countryCode",
  hasError,
}: CountryCodeSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const selected = useMemo(
    () => COUNTRY_CODES.find((c) => c.dialCode === value),
    [value],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return COUNTRY_CODES;
    return COUNTRY_CODES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.dialCode.includes(q) ||
        c.iso2.toLowerCase().includes(q),
    );
  }, [query]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
        onBlur?.();
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open, onBlur]);

  // Focus the search box when opening, reset state when closing
  useEffect(() => {
    if (open) {
      setQuery("");
      setActiveIndex(
        Math.max(
          0,
          COUNTRY_CODES.findIndex((c) => c.dialCode === value),
        ),
      );
      // Wait a tick so the input is mounted before focusing
      requestAnimationFrame(() => searchRef.current?.focus());
    }
  }, [open, value]);

  function selectCountry(dialCode: string) {
    onChange(dialCode);
    setOpen(false);
    onBlur?.();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      onBlur?.();
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      const match = filtered[activeIndex];
      if (match) selectCountry(match.dialCode);
    }
  }

  return (
    <div ref={rootRef} className="relative w-40 flex-none">
      <button
        type="button"
        id={id}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          fieldStyles,
          "flex items-center justify-between gap-2 text-left",
          hasError && "border-terra",
        )}
      >
        <span className="flex items-center gap-2 truncate">
          {selected ? (
            <>
              <Image
                src={countryFlagUrl(selected.iso2)}
                alt=""
                aria-hidden="true"
                width={20}
                height={15}
                unoptimized
                className="flex-none rounded-[2px] object-cover shadow-sm ring-1 ring-ink/10"
              />
              <span>{selected.dialCode}</span>
            </>
          ) : (
            <span className="text-ink/40">Code</span>
          )}
        </span>
        <svg
          aria-hidden="true"
          viewBox="0 0 20 20"
          className={cn(
            "h-4 w-4 flex-none text-ink/50 transition-transform",
            open && "rotate-180",
          )}
        >
          <path
            fill="currentColor"
            d="M5.25 7.5 10 12.25 14.75 7.5H5.25Z"
          />
        </svg>
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Select country code"
          className="absolute left-0 top-full z-20 mt-1 w-72 overflow-hidden rounded-md border border-ink/15 bg-paper shadow-lg"
        >
          <div className="border-b border-ink/10 p-2">
            <input
              ref={searchRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActiveIndex(0);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Search country or code"
              className="w-full rounded border border-ink/15 bg-paper px-3 py-2 font-sans text-sm text-ink placeholder:text-ink/40 focus:border-terra focus:outline-none"
            />
          </div>
          <ul className="max-h-64 overflow-y-auto py-1">
            {filtered.length === 0 && (
              <li className="px-3 py-2 font-sans text-sm text-ink/50">
                No matches
              </li>
            )}
            {filtered.map((c, i) => (
              <li key={`${c.iso2}-${c.dialCode}`}>
                <button
                  type="button"
                  role="option"
                  aria-selected={c.dialCode === value}
                  onClick={() => selectCountry(c.dialCode)}
                  onMouseEnter={() => setActiveIndex(i)}
                  className={cn(
                    "flex w-full items-center gap-2 px-3 py-2 text-left font-sans text-sm text-ink hover:bg-sand/50",
                    i === activeIndex && "bg-sand/50",
                    c.dialCode === value && "font-medium",
                  )}
                >
                  <Image
                    src={countryFlagUrl(c.iso2)}
                    alt=""
                    aria-hidden="true"
                    width={20}
                    height={15}
                    unoptimized
                    className="flex-none rounded-[2px] object-cover shadow-sm ring-1 ring-ink/10"
                  />
                  <span className="flex-1 truncate">{c.name}</span>
                  <span className="text-ink/60">{c.dialCode}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}