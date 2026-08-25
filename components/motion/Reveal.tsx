"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion, type HTMLMotionProps } from "motion/react";

interface RevealProps extends Omit<HTMLMotionProps<"div">, "children"> {
  children: ReactNode;
  index?: number;
  staggerMs?: number;
}

/**
 * Scroll-triggered fade+rise reveal. Staggers by `index` (column/item
 * position). Fires once, never re-triggers on scroll-back.
 */
export default function Reveal({
  children,
  index = 0,
  staggerMs = 80,
  ...props
}: RevealProps) {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return <div className={props.className}>{children}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{
        duration: 0.5,
        ease: "easeOut",
        delay: (index * staggerMs) / 1000,
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
}