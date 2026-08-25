"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Button from "@/components/ui/Button";

export default function Hero() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Trigger on next frame so the initial (pre-animation) styles paint first.
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <section className="relative flex flex-col lg:h-[92vh] lg:min-h-[640px] lg:flex-row">
      {/* Text column */}
      <div className="order-2 flex flex-1 items-center px-5 py-12 sm:px-8 lg:order-1 lg:w-[45%] lg:flex-none lg:px-12 lg:py-0 xl:px-16">
        <div className="mx-auto w-full max-w-md lg:mx-0">
          <p
            className={`font-mono text-xs uppercase tracking-[0.2em] text-terra transition-all duration-500 ease-out motion-reduce:transition-opacity ${
              mounted
                ? "translate-y-0 opacity-100"
                : "translate-y-3 opacity-0 motion-reduce:translate-y-0"
            }`}
          >
            Est. Bangalore · Kochi · Nairobi
          </p>

          <h1
            className={`mt-4 font-display text-4xl leading-[1.1] text-ink transition-all duration-500 ease-out delay-[80ms] motion-reduce:transition-opacity sm:text-5xl lg:text-[3.25rem] ${
              mounted
                ? "translate-y-0 opacity-100"
                : "translate-y-3 opacity-0 motion-reduce:translate-y-0"
            }`}
          >
            The best journeys aren&apos;t sold from a catalogue.
          </h1>

          <p
            className={`mt-5 text-base leading-relaxed text-ink/75 transition-all duration-500 ease-out delay-[180ms] motion-reduce:transition-opacity sm:text-lg ${
              mounted
                ? "translate-y-0 opacity-100"
                : "translate-y-3 opacity-0 motion-reduce:translate-y-0"
            }`}
          >
            We plan a small number of trips a year, each one built around a
            single traveller&apos;s brief — not a brochure of departures
            everyone gets sold the same way.
          </p>

          <div
            className={`mt-8 transition-all duration-500 ease-out delay-[280ms] motion-reduce:transition-opacity ${
              mounted
                ? "translate-y-0 opacity-100"
                : "translate-y-3 opacity-0 motion-reduce:translate-y-0"
            }`}
          >
            <Button as="a" href="/contact" variant="primary">
              Start planning
            </Button>
          </div>
        </div>
      </div>

      {/* Photo column */}
      <div className="relative order-1 h-[50vh] w-full overflow-hidden lg:order-2 lg:h-auto lg:w-[55%] lg:flex-none">
        <div
          className={`h-full w-full transition-transform duration-700 ease-out motion-reduce:transition-none ${
            mounted ? "scale-100" : "scale-[1.03]"
          }`}
        >
          <Image
            src="/images/destinations/kenya.webp"
            alt="Golden savanna grass at dusk in the Maasai Mara, Kenya"
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 55vw"
            className="object-cover"
          />
        </div>
      </div>
    </section>
  );
}