import type { Activity, Machine, MachineStatus } from "@/types/laundry";
import { statusOf } from "./laundry";
export type MachineWatch = {
  machineId: string;
  lastStatus: MachineStatus;
  cycleEnd: number | null;
  category: "loads" | "watching";
};
export function watchMachine(machine: Machine, now: number): MachineWatch {
  return {
    machineId: machine.id,
    lastStatus: statusOf(machine, now),
    cycleEnd: machine.endsAt,
    category: machine.owner === "you" ? "loads" : "watching",
  };
}
export function advanceAlerts(
  machines: Machine[],
  watches: MachineWatch[],
  now: number,
) {
  const events: Activity[] = [];
  const next = watches.flatMap((watch) => {
    const machine = machines.find((m) => m.id === watch.machineId);
    if (!machine) return [];
    const status = statusOf(machine, now);
    const category =
      machine.endsAt === null
        ? watch.category
        : machine.owner === "you"
          ? "loads"
          : "watching";
    const finished =
      watch.cycleEnd !== null &&
      machine.endsAt === watch.cycleEnd &&
      watch.lastStatus === "running" &&
      ["grace", "move"].includes(status);
    const freed = watch.lastStatus !== "available" && status === "available";
    if (finished || freed)
      events.push({
        id: `${freed ? "free" : "done"}-${machine.id}-${watch.cycleEnd}-${category}`,
        text: freed
          ? `${machine.id} is available now.`
          : category === "loads"
            ? `Your load in ${machine.id} is ready to collect.`
            : `${machine.id} has finished. Waiting for pickup.`,
        time: now,
        status: freed ? "available" : status,
        machineId: machine.id,
        recipient: "you",
        category,
      });
    if (
      status === watch.lastStatus &&
      machine.endsAt === watch.cycleEnd &&
      category === watch.category
    )
      return [watch];
    return [
      { ...watch, lastStatus: status, cycleEnd: machine.endsAt, category },
    ];
  });
  return {
    watches: next,
    events,
    changed:
      next.length !== watches.length || next.some((w, i) => w !== watches[i]),
  };
}
