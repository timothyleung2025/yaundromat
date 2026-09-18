"use client";
import { motion, useReducedMotion } from "framer-motion";

// Each outline belongs to its machine. No shared layout ID moves it to a neighbor.
export function OwnershipOutline({ radius = 13 }: { radius?: number }) {
  const reducedMotion = useReducedMotion();
  return (
    <svg className="ownership-outline" aria-hidden="true" focusable="false">
      <motion.rect
        x="1.5"
        y="1.5"
        rx={radius}
        pathLength={1}
        initial={{ strokeDashoffset: reducedMotion ? 0 : 1 }}
        animate={{ strokeDashoffset: 0 }}
        transition={{ duration: reducedMotion ? 0 : 0.65, ease: "easeInOut" }}
      />
    </svg>
  );
}
