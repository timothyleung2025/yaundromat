import { Plus, Waves, ShoppingBasket, Hourglass } from "lucide-react";
import type { MachineStatus } from "@/types/laundry";
import { statuses } from "@/lib/laundry";
export const statusIcons = {
  available: Plus,
  running: Waves,
  grace: Hourglass,
  move: ShoppingBasket,
};
export function StatusBadge({ status }: { status: MachineStatus }) {
  const Icon = statusIcons[status];
  return (
    <span className={`status-pill state-${status}`}>
      <Icon size={15} aria-hidden="true" />
      {statuses[status].label}
    </span>
  );
}
