import type { CSSProperties } from "react";
import type { Machine } from "@/types/laundry";
import { cycleRemaining, machineProgress, statusOf } from "@/lib/laundry";
import { statusIcons } from "./status-visual";
export function CyclePie({ machine, now }: { machine: Machine; now: number }) {
  const status = statusOf(machine, now);
  const timed = status === "running" || status === "grace";
  const Icon = statusIcons[status];
  return (
    <span
      className={`cycle-pie state-${status} ${machine.owner === "you" ? "is-owned" : ""} ${timed ? "is-timed" : ""}`}
      aria-hidden="true"
      style={
        {
          "--remaining": `${(status === "grace" ? machineProgress(machine, now) : cycleRemaining(machine, now)) * 360}deg`,
        } as CSSProperties
      }
    >
      {status !== "running" && <Icon size={19} strokeWidth={2} />}
    </span>
  );
}
