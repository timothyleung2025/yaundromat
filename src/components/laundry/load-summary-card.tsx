import { Bell, BellOff, ChevronRight } from "lucide-react";
import type { Machine } from "@/types/laundry";
import { machineTime, statusOf, statuses } from "@/lib/laundry";
import { CyclePie } from "./cycle-pie";

export function LoadSummaryCard({
  machine,
  now,
  watching,
  onSelect,
  onToggleAlerts,
}: {
  machine: Machine;
  now: number;
  watching: boolean;
  onSelect: (id: string) => void;
  onToggleAlerts: (id: string) => void;
}) {
  const status = statusOf(machine, now);
  const name = `${machine.kind === "washer" ? "Washer" : "Dryer"} ${machine.id}`;
  const timing = machineTime(machine, now);
  return (
    <div
      className={`load-summary-card state-${status}`}
      data-machine-id={machine.id}
    >
      <button
        className="load-summary-open"
        onClick={() => onSelect(machine.id)}
        aria-haspopup="dialog"
        aria-label={`${name}, ${statuses[status].label}, ${timing}`}
      >
        <CyclePie machine={machine} now={now} />
        <span className="load-summary-copy">
          <strong>{name}</strong>
          <small>{timing}</small>
        </span>
        <ChevronRight size={18} />
      </button>
      <button
        className="load-alert-toggle"
        onClick={() => onToggleAlerts(machine.id)}
        aria-label={`Turn ${watching ? "off" : "on"} alerts for ${machine.id}`}
        aria-pressed={watching}
        title={watching ? "Turn off alerts" : "Get alerts"}
      >
        {watching ? <Bell size={18} /> : <BellOff size={18} />}
      </button>
    </div>
  );
}
