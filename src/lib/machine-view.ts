import type { Machine, MachineStatus } from "@/types/laundry";
import { GRACE, machineProgress, machineTime, statusOf } from "./laundry";
export type MachineFilters = {
  kind: "all" | Machine["kind"];
  statuses: MachineStatus[];
};
export const emptyFilters: MachineFilters = { kind: "all", statuses: [] };
export const sortOptions = [
  ["number", "Machine number"],
  ["soonest", "Soonest available"],
] as const;
export type MachineSort =
  | (typeof sortOptions)[number][0]
  | "washer"
  | "dryer"
  | "room"
  | "most"
  | "least"
  | "overdue"
  | "recent";
export type MachineGroup = "available" | "progress" | "expired";
export const groupLabels: Record<MachineGroup, string> = {
  available: "Available",
  progress: "In progress",
  expired: "Expired",
};
export function groupOf(machine: Machine, now: number): MachineGroup {
  const status = statusOf(machine, now);
  return status === "available"
    ? "available"
    : status === "move"
      ? "expired"
      : "progress";
}
export function overdueTime(machine: Machine, now: number) {
  return machine.endsAt === null
    ? 0
    : Math.max(0, now - machine.endsAt - GRACE);
}
export function rowTiming(machine: Machine, now: number) {
  const expired = statusOf(machine, now) === "move";
  return {
    text: machineTime(machine, now),
    progress: expired ? 1 : machineProgress(machine, now),
    label: expired
      ? "Pickup window exceeded"
      : statusOf(machine, now) === "grace"
        ? "Pickup window remaining"
        : "Cycle completion",
  };
}
export function selectMachines(
  machines: Machine[],
  now: number,
  filters: MachineFilters,
  sort: MachineSort,
  typeFirst?: Machine["kind"],
): Machine[] {
  const remaining = (m: Machine) =>
    m.endsAt === null ? 0 : Math.max(0, m.endsAt - now);
  // This is an estimate of when the pickup window ends, not a promise of availability.
  const ready = (m: Machine) =>
    m.endsAt === null ? 0 : Math.max(0, m.endsAt + GRACE - now);
  const number = (m: Machine) => Number(m.id.slice(1));
  return machines
    .map((machine, index) => ({ machine, index }))
    .filter(
      ({ machine: m }) =>
        (filters.kind === "all" || m.kind === filters.kind) &&
        (!filters.statuses.length ||
          filters.statuses.includes(statusOf(m, now))),
    )
    .sort((a, b) => {
      const x = a.machine,
        y = b.machine;
      const typeOrder = typeFirst
        ? Number(x.kind !== typeFirst) - Number(y.kind !== typeFirst)
        : 0;
      if (typeOrder) return typeOrder;
      let delta = 0;
      switch (sort) {
        case "soonest":
          delta =
            Number(x.endsAt !== null) - Number(y.endsAt !== null) ||
            ready(x) - ready(y);
          break;
        case "most":
          delta = remaining(y) - remaining(x);
          break;
        case "least":
          delta = remaining(x) - remaining(y);
          break;
        case "number":
          delta = number(x) - number(y);
          break;
        case "washer":
          delta = Number(x.kind !== "washer") - Number(y.kind !== "washer");
          break;
        case "dryer":
          delta = Number(x.kind !== "dryer") - Number(y.kind !== "dryer");
          break;
        case "overdue":
          delta = overdueTime(y, now) - overdueTime(x, now);
          break;
        case "recent": {
          const ex = groupOf(x, now) === "expired",
            ey = groupOf(y, now) === "expired";
          delta =
            Number(ey) - Number(ex) ||
            (ex && ey ? overdueTime(x, now) - overdueTime(y, now) : 0);
          break;
        }
      }
      return delta || a.index - b.index;
    })
    .map(({ machine }) => machine);
}

// Browse the first useful availability tier for the requested machine type.
export function nextMachineStatus(
  machines: Machine[],
  now: number,
  kind: MachineFilters["kind"],
): MachineStatus {
  const matching = machines.filter(
    (machine) => kind === "all" || machine.kind === kind,
  );
  return (
    (["available", "move", "grace", "running"] as const).find((status) =>
      matching.some((machine) => statusOf(machine, now) === status),
    ) ?? "available"
  );
}
