"use client";

import { motion, useReducedMotion } from "motion/react";
import Container from "@/components/ui/Container";
import Button from "@/components/ui/Button";

interface Step {
  label: string;
  body: string;
}

const steps: Step[] = [
  {
    label: "01 — Tell us what you're picturing",
    body: "A place, a mood, a rough window of dates — whatever you've got is enough to start.",
  },
  {
    label: "02 — We shape a route around it",
    body: "A planner who's done the trip drafts an itinerary, priced and paced for how you actually travel.",
  },
  {
    label: "03 — You review and refine",
    body: "Swap a stop, add a day, cut the transfer that eats a whole afternoon — it's yours until it's right.",
  },
  {
    label: "04 — You go",
    body: "Bookings confirmed, documents in hand, and a number to call if anything on the ground changes.",
  },
];

export default function HowItStarts() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <section className="py-14 sm:py-20">
      <Container>
        <div className="mb-8 max-w-2xl sm:mb-10">
          <h2 className="font-display text-3xl text-ink sm:text-4xl">
            How your journey starts
          </h2>
        </div>

        <ol className="flex flex-col gap-8 lg:flex-row lg:gap-0">
          {steps.map((step, index) => {
            const content = (
              <>
                {/* Connector: dash between steps, not big numerals */}
                <div className="flex items-center gap-2 lg:hidden">
                  <span className="font-mono text-xs uppercase tracking-[0.14em] text-terra">
                    {step.label}
                  </span>
                </div>
                <div className="hidden items-center lg:flex">
                  {index > 0 && (
                    <span
                      className="mr-3 h-px w-8 flex-none bg-ink/20"
                      aria-hidden="true"
                    />
                  )}
                  <span className="font-mono text-xs uppercase tracking-[0.14em] text-terra">
                    {step.label}
                  </span>
                </div>
                <p className="text-sm leading-relaxed text-ink/75">
                  {step.body}
                </p>
              </>
            );

            if (prefersReducedMotion) {
              return (
                <li
                  key={step.label}
                  className="flex flex-1 flex-col gap-2 lg:px-5"
                >
                  {content}
                </li>
              );
            }

            return (
              <motion.li
                key={step.label}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{
                  duration: 0.5,
                  ease: "easeOut",
                  delay: (index * 100) / 1000,
                }}
                className="flex flex-1 flex-col gap-2 lg:px-5"
              >
                {content}
              </motion.li>
            );
          })}
        </ol>

        <div className="mt-10">
          <Button as="a" href="/contact" variant="text-link">
            Start with step one
            <span aria-hidden="true">→</span>
          </Button>
        </div>
      </Container>
    </section>
  );
}