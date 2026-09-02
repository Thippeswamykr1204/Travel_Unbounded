"use client";

import { cn } from "@/lib/utils";

interface QuickReplyChipsProps {
  onSelect: (text: string) => void;
  disabled?: boolean;
}

const QUICK_REPLIES: { label: string; sentence: string }[] = [
  { label: "Wildlife Safari", sentence: "I'm interested in a wildlife safari trip." },
  { label: "Beach Vacation", sentence: "I'm interested in a beach vacation." },
  { label: "Mountain Escape", sentence: "I'm interested in a mountain escape." },
  { label: "Cultural Immersion", sentence: "I'm interested in a cultural immersion trip." },
  { label: "Surprise Me", sentence: "Surprise me — pick something you think I'd love." },
];

export default function QuickReplyChips({ onSelect, disabled }: QuickReplyChipsProps) {
  return (
    <div className="flex flex-wrap gap-2 px-4 pb-3">
      {QUICK_REPLIES.map((reply) => (
        <button
          key={reply.label}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(reply.sentence)}
          className={cn(
            "rounded-full border border-terra/30 bg-terra/10 px-4 py-2 font-sans text-xs font-medium text-terra transition-colors",
            "hover:bg-terra/20 active:bg-terra/25",
            disabled && "cursor-not-allowed opacity-50 hover:bg-terra/10",
          )}
        >
          {reply.label}
        </button>
      ))}
    </div>
  );
}