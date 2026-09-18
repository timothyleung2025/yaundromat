import { makeMachines, MINUTE, GRACE, statusOf } from "./laundry";
import { watchMachine } from "./alerts";
import { restoreHistory } from "./load-history";
import type { LaundryData } from "./laundry-storage";
import type { Activity, Machine } from "@/types/laundry";
export type Scenario = 1 | 2 | 3 | 4;
export const scenarios = [
  {
    id: 1,
    name: "Free or ready for pickup",
  },
  {
    id: 2,
    name: "Every machine is taken",
  },
  {
    id: 3,
    name: "My load is ready",
  },
  {
    id: 4,
    name: "My load was moved",
  },
] as const;
export function scenarioLaundry(scenario: Scenario, now: number): LaundryData {
  const machines = makeMachines(now).map((machine, i): Machine => {
    if (scenario === 1) {
      const free = i % 3 === 0;
      return {
        ...machine,
        endsAt: free ? null : now - (i % 2 ? 8 : 2) * MINUTE,
        owner: free ? undefined : "neighbor",
      };
    }
    if (scenario === 2) {
      const end =
        machine.id === "W04"
          ? now - GRACE + 15000
          : machine.id === "D03"
            ? now - 2 * MINUTE
            : now + (4 + ((i * 7) % 27)) * MINUTE;
      return {
        ...machine,
        endsAt: end,
        owner: "neighbor",
      };
    }
    if (scenario === 3) {
      if (machine.id === "W03")
        return { ...machine, endsAt: now - 2 * MINUTE, owner: "you" };
      if (machine.id === "D04")
        return { ...machine, endsAt: now + 11 * MINUTE, owner: "you" };
      return machine;
    }
    if (machine.id === "W03")
      return { ...machine, endsAt: null, owner: undefined };
    if (machine.id === "D03")
      return { ...machine, endsAt: now + 12 * MINUTE, owner: "you" };
    return machine;
  });
  const watched = machines.filter(
    (machine) =>
      machine.owner === "you" ||
      (scenario === 2 && ["W04", "D03"].includes(machine.id)),
  );
  const activity: Activity[] = watched
    .filter((machine) => ["grace", "move"].includes(statusOf(machine, now)))
    .map((machine) => ({
      id: `scenario-${scenario}-ready-${machine.id}-${now}`,
      text:
        machine.owner === "you"
          ? `Your load in ${machine.id} is ready to collect.`
          : `${machine.id} has finished. Waiting for pickup.`,
      time: machine.endsAt!,
      status: statusOf(machine, now),
      machineId: machine.id,
      recipient: "you",
      category: machine.owner === "you" ? "loads" : "watching",
    }));
  const history = restoreHistory([], machines);
  if (scenario === 4) {
    activity.unshift({
      id: `scenario-moved-${now}`,
      text: "Your laundry from W05 was moved to Cubby B.",
      time: now - 2 * MINUTE,
      status: "move",
      machineId: "W05",
      location: "Cubby B",
      recipient: "you",
      category: "loads",
    });
    history.push({
      id: `scenario-cubby-${now}`,
      machineId: "W05",
      kind: "washer",
      startedAt: now - 48 * MINUTE,
      endsAt: now - 18 * MINUTE,
      movedTo: "Cubby B",
      movedAt: now - 2 * MINUTE,
    });
  }
  return {
    machines,
    activity,
    history,
    watches: watched.map((machine) => watchMachine(machine, now)),
    lastRead: 0,
    scenario,
  };
}
