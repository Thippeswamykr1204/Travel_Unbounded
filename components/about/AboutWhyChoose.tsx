"use client";

import { motion, useReducedMotion } from "motion/react";
import Container from "@/components/ui/Container";

interface Reason {
  label: string;
  body: string;
}

const reasons: Reason[] = [
  {
    label: "Who answers",
    body: "Someone from Bangalore, Kochi, or Nairobi picks up — not a call center reading from a script.",
  },
  {
    label: "Who's been there",
    body: "Every route on this site has been walked, driven, or sailed by someone on the team, in the last two years.",
  },
  {
    label: "How it's priced",
    body: "One quote, all-in, before you book — no resort commissions padding the number you don't see.",
  },
  {
    label: "What happens if it rains",
    body: "A route built around you can bend around a washed-out road or a missed flight. A fixed departure can't.",
  },
];

export default function AboutWhyChoose() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <section className="py-14 sm:py-20">
      <Container>
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] lg:gap-16">
          <div>
            <h2 className="font-display text-3xl text-ink sm:text-4xl">
              What that means for you
            </h2>
            <p className="mt-4 max-w-sm font-sans text-base leading-relaxed text-ink/70">
              A small team, in three offices, who&apos;d rather plan fewer
              trips well than a lot of trips the same way.
            </p>
          </div>

          <ul className="space-y-8">
            {reasons.map((reason, index) =>
              prefersReducedMotion ? (
                <li
                  key={reason.label}
                  className="border-l-2 border-terra pl-5 sm:pl-6"
                >
                  <span className="font-mono text-xs uppercase tracking-[0.16em] text-terra">
                    {reason.label}
                  </span>
                  <p className="mt-2 font-sans text-base leading-relaxed text-ink/80">
                    {reason.body}
                  </p>
                </li>
              ) : (
                <motion.li
                  key={reason.label}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{
                    duration: 0.5,
                    ease: "easeOut",
                    delay: (index * 90) / 1000,
                  }}
                  className="border-l-2 border-terra pl-5 sm:pl-6"
                >
                  <span className="font-mono text-xs uppercase tracking-[0.16em] text-terra">
                    {reason.label}
                  </span>
                  <p className="mt-2 font-sans text-base leading-relaxed text-ink/80">
                    {reason.body}
                  </p>
                </motion.li>
              ),
            )}
          </ul>
        </div>
      </Container>
    </section>
  );
}