"use client";
import type { Machine } from "@/types/laundry";
import { clock, GRACE, machineTime, statusOf, statuses } from "@/lib/laundry";
import { CyclePie } from "./cycle-pie";
import { OwnershipOutline } from "./ownership-outline";
export function MachineTile({
  machine,
  now,
  selected,
  onClick,
}: {
  machine: Machine;
  now: number;
  selected: boolean;
  onClick: () => void;
}) {
  const status = statusOf(machine, now);
  const statusLabel =
    status === "move" && machine.owner === "you"
      ? "Pickup overdue"
      : statuses[status].label;
  return (
    <button
      id={`machine-${machine.id}`}
      className={`map-machine kind-${machine.kind} state-${status} ${machine.owner === "you" ? "is-owned" : ""} ${selected ? "is-selected" : ""}`}
      onClick={onClick}
      aria-pressed={selected}
      aria-haspopup="dialog"
      aria-label={`${machine.kind} ${machine.id}, ${statusLabel}, ${machineTime(machine, now)}${machine.owner === "you" ? ", your load" : ""}`}
    >
      <span className="map-machine-id">{machine.id}</span>
      <CyclePie machine={machine} now={now} />
      <span className="tile-time">
        {machine.endsAt !== null && machine.endsAt > now
          ? clock(machine.endsAt - now)
          : status === "grace"
            ? `${clock(machine.endsAt! + GRACE - now)} pickup`
            : status === "available"
              ? "Ready"
              : statusLabel}
      </span>
      {machine.owner === "you" && <span className="map-owner-tag">Yours</span>}
      {machine.owner === "you" && <OwnershipOutline />}
    </button>
  );
}
