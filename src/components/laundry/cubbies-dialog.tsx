import type { Activity } from "@/types/laundry";
import { clock } from "@/lib/laundry";
import { GlassDialog } from "@/components/ui/glass-dialog";
export function CubbiesDialog({
  activity,
  now,
  onClose,
}: {
  activity: Activity[];
  now: number;
  onClose: () => void;
}) {
  return (
    <GlassDialog
      titleId="cubbies-title"
      onClose={onClose}
      className="cubbies-dialog"
    >
      <h2 id="cubbies-title">Cubbies</h2>
      <p className="dialog-description">
        Laundry moved from a machine is logged here.
      </p>
      <div className="cubby-contents">
        {["Cubby A", "Cubby B", "Cubby C"].map((cubby) => {
          const moves = activity
            .filter((event) => event.location === cubby && event.machineId)
            .sort((a, b) => b.time - a.time);
          return (
            <section key={cubby}>
              <h3>{cubby}</h3>
              {moves.length ? (
                <ul>
                  {moves.map((event) => (
                    <li key={event.id}>
                      <strong>
                        {event.machineId!.startsWith("W") ? "Washer" : "Dryer"}{" "}
                        {event.machineId}
                      </strong>
                      <span>Moved {clock(now - event.time)} ago</span>
                      <time dateTime={new Date(event.time).toISOString()}>
                        {new Date(event.time).toLocaleString([], {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </time>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No moves recorded</p>
              )}
            </section>
          );
        })}
      </div>
    </GlassDialog>
  );
}
