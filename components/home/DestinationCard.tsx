import Image from "next/image";
import Link from "next/link";
import type { Destination } from "@/types/destination";
import { cn } from "@/lib/utils";

interface DestinationCardProps {
  destination: Destination;
}

export default function DestinationCard({ destination }: DestinationCardProps) {
  const {
    name,
    image,
    mood,
    description,
    price,
    duration,
    category,
  } = destination;

  const formattedPrice = `From ₹${price.toLocaleString("en-IN")}`;
  const stampBg = category === "india" ? "bg-terra" : "bg-horizon";

  return (
    <article className="group flex flex-col overflow-hidden rounded-md bg-paper">
      {/* Photo */}
      <div className="relative aspect-[4/5] w-full overflow-hidden">
        <Image
          src={image}
          alt={name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 20vw"
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
        />

        {/* Stamp badge */}
        <span
          className={cn(
            "absolute right-3 top-3 rotate-[-6deg] rounded-sm border border-paper/70 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-paper shadow-sm",
            "grayscale transition-[filter] duration-300 ease-out group-hover:grayscale-0",
            stampBg,
          )}
        >
          {mood}
        </span>

        {/* Torn-paper seam */}
        <svg
          className="absolute inset-x-0 bottom-0 h-2 w-full text-paper"
          viewBox="0 0 400 8"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            d="M0,8 L0,3 L8,5 L17,1 L26,4 L35,2 L44,6 L53,3 L62,5 L71,1 L80,4 L89,2 L98,6 L107,3 L116,5 L125,1 L134,4 L143,2 L152,6 L161,3 L170,5 L179,1 L188,4 L197,2 L206,6 L215,3 L224,5 L233,1 L242,4 L251,2 L260,6 L269,3 L278,5 L287,1 L296,4 L305,2 L314,6 L323,3 L332,5 L341,1 L350,4 L359,2 L368,6 L377,3 L386,5 L395,1 L400,3 L400,8 Z"
            fill="currentColor"
          />
        </svg>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-2 px-1 pb-1 pt-4">
        <h3 className="font-display text-xl text-ink">{name}</h3>
        <p className="text-sm leading-relaxed text-ink/75">{description}</p>

        <div className="mt-1 flex items-baseline justify-between">
          <span className="text-sm font-medium text-ink">{formattedPrice}</span>
          <span className="font-mono text-xs text-ink/70">{duration}</span>
        </div>

        <Link
          href={`/contact?destination=${destination.id}`}
          className={cn(
            "inline-flex items-center gap-2 font-sans transition-colors duration-200",
            "mt-2 gap-1.5 self-start text-sm font-medium text-terra underline-offset-4 hover:underline",
          )}
        >
          Explore destination
          <span className="inline-block transition-transform duration-200 ease-out group-hover:translate-x-1">
            →
          </span>
        </Link>
      </div>
    </article>
  );
}