import type { Machine } from "@/types/laundry";
import { MINUTE } from "./laundry";

export type LoadRecord = {
  id: string;
  machineId: string;
  kind: Machine["kind"];
  startedAt: number;
  endsAt: number;
  collectedAt?: number;
  movedTo?: string;
  movedAt?: number;
};
export function loadRecord(machine: Machine): LoadRecord | null {
  if (machine.owner !== "you" || machine.endsAt === null) return null;
  return {
    id: `${machine.id}-${machine.endsAt}`,
    machineId: machine.id,
    kind: machine.kind,
    startedAt: machine.endsAt - (machine.kind === "washer" ? 30 : 45) * MINUTE,
    endsAt: machine.endsAt,
  };
}
export function restoreHistory(
  raw: unknown,
  machines: Machine[],
): LoadRecord[] {
  const records: LoadRecord[] = Array.isArray(raw)
    ? raw.filter(
        (r): r is LoadRecord =>
          r &&
          typeof r.id === "string" &&
          machines.some((m) => m.id === r.machineId && m.kind === r.kind) &&
          Number.isFinite(r.startedAt) &&
          Number.isFinite(r.endsAt) &&
          r.endsAt >= r.startedAt &&
          (r.collectedAt === undefined ||
            (Number.isFinite(r.collectedAt) && r.collectedAt >= r.endsAt)) &&
          (r.movedTo === undefined ||
            ["Cubby A", "Cubby B", "Cubby C"].includes(r.movedTo)) &&
          (r.movedAt === undefined ||
            (Number.isFinite(r.movedAt) && r.movedAt >= r.endsAt)),
      )
    : [];
  for (const machine of machines) {
    const record = loadRecord(machine);
    if (
      record &&
      !records.some(
        (r) => r.machineId === record.machineId && r.endsAt === record.endsAt,
      )
    )
      records.push(record);
  }
  return Array.from(new Map(records.map((r) => [r.id, r])).values());
}
export function dayKey(time: number) {
  const date = new Date(time);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
