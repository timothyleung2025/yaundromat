import { ChevronDown } from "lucide-react";
import { statuses } from "@/lib/laundry";
import type { MachineStatus } from "@/types/laundry";
import { statusIcons } from "./status-visual";
export function StatusLegend() {
  return (
    <details className="map-legend">
      <summary>
        <span>
          <i />
          <i />
          <i />
          Status key
        </span>
        <ChevronDown size={16} />
      </summary>
      <div className="legend-popover">
        {(Object.keys(statuses) as MachineStatus[]).map((status) => {
          const Icon = statusIcons[status];
          return (
            <div key={status} className={`legend-row state-${status}`}>
              <span className="legend-symbol">
                <Icon size={16} />
              </span>
              <span>
                {statuses[status].label}
                {status === "grace" && (
                  <small>Pickup window · 5 min total</small>
                )}
                {status === "move" && <small>Pickup window ended</small>}
              </span>
            </div>
          );
        })}
        <p>
          Same space.
          <br />A kinder wait.
        </p>
      </div>
    </details>
  );
}
