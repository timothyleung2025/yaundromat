import type { Activity, Machine, MachineStatus } from "@/types/laundry";
import { makeMachines, statuses, MINUTE } from "./laundry";
import { watchMachine, type MachineWatch } from "./alerts";
import { roomSlots } from "./silliman";
import { restoreHistory, type LoadRecord } from "./load-history";
export const STORAGE = "yaundromat-silliman-v2";
export type LaundryData = {
  machines: Machine[];
  activity: Activity[];
  watches: MachineWatch[];
  lastRead: number;
  history: LoadRecord[];
};
export function freshLaundry(now: number): LaundryData {
  const machines = makeMachines(now).map((machine) =>
    machine.id === "D03"
      ? { ...machine, owner: "you" as const, endsAt: now - 4 * MINUTE }
      : machine,
  );
  return {
    machines,
    activity: [
      {
        id: `demo-moved-W05-${now}`,
        text: "Your laundry from W05 was moved to Cubby B.",
        time: now - 2 * MINUTE,
        status: "move",
        machineId: "W05",
        location: "Cubby B",
        recipient: "you",
        category: "loads",
      },
      {
        id: `demo-ready-D03-${now}`,
        text: "Your load in D03 is ready to collect.",
        time: now - 4 * MINUTE,
        status: "grace",
        machineId: "D03",
        recipient: "you",
        category: "loads",
      },
    ],
    watches: machines
      .filter((m) => m.owner === "you")
      .map((m) => watchMachine(m, now)),
    lastRead: 0,
    history: [
      ...restoreHistory([], machines),
      {
        id: `demo-load-W05-${now}`,
        machineId: "W05",
        kind: "washer",
        startedAt: now - 48 * MINUTE,
        endsAt: now - 18 * MINUTE,
        movedTo: "Cubby B",
        movedAt: now - 2 * MINUTE,
      },
    ],
  };
}
// Preserve saved loads, watches and event IDs when reducing the status model.
function migrateStatus(
  status: MachineStatus | "almost" | "done" | undefined,
): MachineStatus | undefined {
  if (status === "almost") return "running";
  if (status === "done") return "grace";
  return status;
}
export function restoreLaundry(raw: string | null, now: number): LaundryData {
  try {
    const value = JSON.parse(raw ?? "null") as LaundryData;
    if (Array.isArray(value?.activity)) {
      value.activity = value.activity.map(
        (event) =>
          event && {
            ...event,
            status: migrateStatus(event.status),
            ...(Number.isFinite(event.readAt)
              ? { readAt: event.readAt }
              : event.time <= value.lastRead
                ? { readAt: value.lastRead }
                : {}),
          },
      );
    }
    if (Array.isArray(value?.watches)) {
      value.watches = value.watches.map(
        (watch) =>
          watch && {
            ...watch,
            lastStatus: migrateStatus(watch.lastStatus) as MachineStatus,
          },
      );
    }
    if (
      !value ||
      !Array.isArray(value.machines) ||
      value.machines.length !== roomSlots.length ||
      !roomSlots.every(
        (slot) =>
          value.machines.filter(
            (m) =>
              m &&
              m.id === slot.id &&
              m.kind === slot.kind &&
              (m.endsAt === null || Number.isFinite(m.endsAt)) &&
              (m.owner === undefined ||
                m.owner === "you" ||
                m.owner === "neighbor"),
          ).length === 1,
      ) ||
      !Array.isArray(value.activity) ||
      !value.activity.every(
        (a) =>
          a &&
          typeof a.id === "string" &&
          typeof a.text === "string" &&
          Number.isFinite(a.time) &&
          ["you", "neighbor"].includes(a.recipient) &&
          ["loads", "watching"].includes(a.category ?? "") &&
          (!a.status || Object.hasOwn(statuses, a.status)),
      ) ||
      !Array.isArray(value.watches) ||
      !value.watches.every(
        (w) =>
          w &&
          roomSlots.some((slot) => slot.id === w.machineId) &&
          Object.hasOwn(statuses, w.lastStatus) &&
          (w.cycleEnd === null || Number.isFinite(w.cycleEnd)) &&
          ["loads", "watching"].includes(w.category),
      ) ||
      new Set(value.watches.map((w) => w.machineId)).size !==
        value.watches.length ||
      !Number.isFinite(value.lastRead)
    )
      return freshLaundry(now);
    return { ...value, history: restoreHistory(value.history, value.machines) };
  } catch {
    return freshLaundry(now);
  }
}
