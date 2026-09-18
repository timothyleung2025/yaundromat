import type { Machine } from "@/types/laundry";
import { MachineTile } from "./machine-tile";
import { Cubbies, Entrance, Plant } from "./landmarks";
import { roomSlots } from "@/lib/silliman";
export function RoomMap({
  machines,
  matchingIds,
  now,
  selected,
  onSelect,
  onCubbies,
  ownedCubbies,
}: {
  machines: Machine[];
  matchingIds?: string[];
  now: number;
  selected: string | null;
  onSelect: (id: string) => void;
  onCubbies: () => void;
  ownedCubbies: string[];
}) {
  return (
    <section className="room-overview" aria-label="Laundry room floor plan">
      <div className="floorplan">
        <div className="room-wall wall-top" aria-hidden="true" />
        <div className="room-wall wall-left" aria-hidden="true" />
        <div className="room-wall wall-right" aria-hidden="true" />
        <Plant />
        <Cubbies onClick={onCubbies} ownedCubbies={ownedCubbies} />
        <div className="silliman-machines">
          {roomSlots.map((slot) => {
            const machine = machines.find((m) => m.id === slot.id);
            if (!machine) return null;
            return (
              <div
                key={slot.id}
                className="machine-slot"
                style={{ gridColumn: slot.column, gridRow: slot.row }}
              >
                {matchingIds && !matchingIds.includes(machine.id) ? (
                  <div className="map-machine filtered-slot" aria-hidden="true">
                    {machine.id}
                  </div>
                ) : (
                  <MachineTile
                    machine={machine}
                    now={now}
                    selected={selected === machine.id}
                    onClick={() => onSelect(machine.id)}
                  />
                )}
              </div>
            );
          })}
        </div>
        <Entrance />
      </div>
    </section>
  );
}
