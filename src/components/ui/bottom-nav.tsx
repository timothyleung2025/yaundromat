"use client";
import { motion, useReducedMotion } from "framer-motion";
import { Grid2X2, Shirt, Bell } from "lucide-react";
export type Tab = "room" | "loads" | "alerts";
export function BottomNav({
  active,
  onChange,
  unread,
}: {
  active: Tab;
  onChange: (tab: Tab) => void;
  unread: number;
}) {
  const reducedMotion = useReducedMotion();
  return (
    <nav className="bottom-nav" aria-label="Main navigation">
      {(
        [
          { id: "room", label: "Laundry room", Icon: Grid2X2 },
          { id: "loads", label: "My loads", Icon: Shirt },
          { id: "alerts", label: "Alerts", Icon: Bell },
        ] as const
      ).map(({ id, label, Icon }) => (
        <button
          key={id}
          aria-label={label}
          aria-description={
            id === "alerts" ? `${unread} unread notifications` : undefined
          }
          onClick={() => onChange(id)}
          aria-current={active === id ? "page" : undefined}
          className={active === id ? "active" : ""}
        >
          {active === id && (
            <motion.span
              className="nav-active-pill"
              layoutId="bottom-nav-active-pill"
              aria-hidden="true"
              transition={
                reducedMotion
                  ? { duration: 0 }
                  : { type: "spring", stiffness: 420, damping: 36 }
              }
            />
          )}
          <span className="nav-icon">
            <Icon size={21} />
            {id === "alerts" && unread > 0 && (
              <i className="unread-count" aria-hidden="true">
                {unread > 99 ? "99+" : unread}
              </i>
            )}
          </span>
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}
