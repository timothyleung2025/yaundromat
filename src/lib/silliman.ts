import type { Machine } from "@/types/laundry";

// Entryway M: two washers across the top, four on the left,
// four on the inner right, and four dryers on the far right.
export const roomSlots = [
  { id: "W01", kind: "washer" as const, column: 2, row: 1 },
  { id: "W02", kind: "washer" as const, column: 3, row: 1 },
  ...Array.from({ length: 4 }, (_, i) => ({
    id: `W0${i + 3}`,
    kind: "washer" as const,
    column: 1,
    row: i + 2,
  })),
  ...Array.from({ length: 4 }, (_, i) => ({
    id: `W${String(i + 7).padStart(2, "0")}`,
    kind: "washer" as const,
    column: 3,
    row: i + 2,
  })),
  ...Array.from({ length: 4 }, (_, i) => ({
    id: `D0${i + 1}`,
    kind: "dryer" as const,
    column: 4,
    row: i + 2,
  })),
] satisfies {
  id: string;
  kind: Machine["kind"];
  column: number;
  row: number;
}[];

// Accept a printed machine ID or a QR URL carrying ?machine=W01.
// Never navigate to a scanned URL or accept a machine outside this room.
export function resolveMachineCode(input: string): string | null {
  let value = input.trim();
  try {
    const url = new URL(value);
    value =
      url.searchParams.get("machine") ??
      url.pathname.split("/").filter(Boolean).at(-1) ??
      "";
  } catch {
    /* A plain machine ID is expected for manual entry. */
  }
  const match = /^(W|D|WASHER|DRYER)[\s-]*0*(\d{1,2})$/i.exec(value);
  if (!match) return null;
  const id = `${match[1][0].toUpperCase()}${match[2].padStart(2, "0")}`;
  return roomSlots.some((slot) => slot.id === id) ? id : null;
}
