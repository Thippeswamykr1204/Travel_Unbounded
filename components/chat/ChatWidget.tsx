"use client";

import { useRef, useState } from "react";
import { usePathname } from "next/navigation";
import ChatWindow from "@/components/chat/ChatWindow";

export default function ChatWidget() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const toggleButtonRef = useRef<HTMLButtonElement>(null);

  if (pathname?.startsWith("/admin")) {
    return null;
  }

  const handleClose = () => {
    setOpen(false);
    toggleButtonRef.current?.focus();
  };

  return (
    <>
      {!open && (
        <button
          ref={toggleButtonRef}
          type="button"
          aria-label="Open chat"
          onClick={() => setOpen(true)}
          className="fixed bottom-[calc(1.5rem+env(safe-area-inset-bottom))] right-[calc(1.5rem+env(safe-area-inset-right))] z-[70] inline-flex h-14 w-14 items-center justify-center rounded-full bg-terra text-paper shadow-lg transition-colors hover:bg-terra/90 active:bg-terra/80"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
          </svg>
        </button>
      )}

      {open && <ChatWindow onClose={handleClose} />}
    </>
  );
}