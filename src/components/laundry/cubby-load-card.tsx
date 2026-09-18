import { Box, ChevronRight } from "lucide-react";
import type { LoadRecord } from "@/lib/load-history";
import { clock } from "@/lib/laundry";
export function CubbyLoadCard({
  record,
  now,
  onOpen,
}: {
  record: LoadRecord;
  now: number;
  onOpen: () => void;
}) {
  return (
    <button
      className="load-summary-card cubby-load-card"
      onClick={onOpen}
      aria-haspopup="dialog"
      aria-label={`${record.movedTo}, your load from ${record.machineId}`}
    >
      <span className="cubby-load-icon">
        <Box size={22} />
      </span>
      <span className="load-summary-copy">
        <strong>{record.movedTo}</strong>
        <small>
          <span>
            From {record.kind === "washer" ? "Washer" : "Dryer"}{" "}
            {record.machineId}
          </span>
          <span>Sitting {clock(now - (record.movedAt ?? record.endsAt))}</span>
        </small>
      </span>
      <ChevronRight size={18} />
    </button>
  );
}
