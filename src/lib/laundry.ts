import type { Machine, MachineStatus } from "@/types/laundry";
import { roomSlots } from "./silliman";
export const MINUTE = 60_000;
export const GRACE = 5 * MINUTE;
export const statuses: Record<MachineStatus, { label: string; short: string }> =
  {
    available: { label: "Available", short: "Ready for you" },
    running: { label: "Running", short: "In a spin" },
    grace: { label: "Pickup Window", short: "Give them a moment" },
    move: { label: "Okay to move", short: "Handle with care" },
  };
export function statusOf(machine: Machine, now: number): MachineStatus {
  if (machine.endsAt === null) return "available";
  const remaining = machine.endsAt - now;
  if (remaining > 0) return "running";
  if (remaining > -GRACE) return "grace";
  return "move";
}
export function clock(ms: number) {
  const seconds = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}
export function machineTime(machine: Machine, now: number) {
  if (machine.endsAt === null)
    return `${machine.kind === "washer" ? 30 : 45} min cycle · Ready`;
  const status = statusOf(machine, now);
  if (status === "running") return `${clock(machine.endsAt - now)} left`;
  if (status === "grace")
    return `Sitting ${clock(now - machine.endsAt)} · ${clock(machine.endsAt + GRACE - now)} left in Pickup Window`;
  return `${machine.owner === "you" ? "Pickup overdue" : "Okay to move"} · Sitting ${clock(now - machine.endsAt)}`;
}
export function makeMachines(now: number): Machine[] {
  const offsets = [
    null,
    22,
    3,
    -2,
    null,
    24,
    12,
    8,
    18,
    6,
    -8,
    null,
    -0.25,
    16,
  ];
  return roomSlots.map((slot, i) => ({
    id: slot.id,
    kind: slot.kind,
    endsAt: offsets[i] === null ? null : now + offsets[i]! * MINUTE,
    owner: offsets[i] === null ? undefined : i === 2 ? "you" : "neighbor",
  }));
}

export function machineProgress(machine: Machine, now: number) {
  if (machine.endsAt === null) return 0;
  const status = statusOf(machine, now);
  if (status === "grace")
    return Math.max(0, Math.min(1, (machine.endsAt + GRACE - now) / GRACE));
  const duration = (machine.kind === "washer" ? 30 : 45) * MINUTE;
  return Math.max(0, Math.min(1, 1 - (machine.endsAt - now) / duration));
}

export function cycleRemaining(machine: Machine, now: number) {
  if (machine.endsAt === null) return 0;
  return Math.max(
    0,
    Math.min(
      1,
      (machine.endsAt - now) / ((machine.kind === "washer" ? 30 : 45) * MINUTE),
    ),
  );
}
