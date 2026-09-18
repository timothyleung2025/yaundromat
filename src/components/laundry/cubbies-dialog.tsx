import type { Activity } from "@/types/laundry";
import type { LoadRecord } from "@/lib/load-history";
import { clock } from "@/lib/laundry";
import { GlassDialog } from "@/components/ui/glass-dialog";
export function CubbiesDialog({
  activity,
  records,
  now,
  onClose,
  onCollect,
}: {
  activity: Activity[];
  records: LoadRecord[];
  now: number;
  onClose: () => void;
  onCollect: (id: string) => void;
}) {
  return (
    <GlassDialog
      titleId="cubbies-title"
      onClose={onClose}
      className="cubbies-dialog"
    >
      <h2 id="cubbies-title">Cubbies</h2>
      <div className="cubby-contents">
        {["Cubby A", "Cubby B", "Cubby C"].map((cubby) => {
          const yours = records.filter(
            (record) =>
              record.movedTo === cubby && record.collectedAt === undefined,
          );
          const moves = activity
            .filter(
              (event) =>
                event.location === cubby &&
                event.machineId &&
                !yours.some(
                  (record) =>
                    record.machineId === event.machineId &&
                    Math.abs((record.movedAt ?? 0) - event.time) < 1000,
                ),
            )
            .sort((a, b) => b.time - a.time);
          return (
            <section
              key={cubby}
              className={yours.length ? "has-your-load" : ""}
            >
              <h3>
                {cubby}
                {yours.length > 0 && (
                  <span className="cubby-yours-label">Your load is here</span>
                )}
              </h3>
              {yours.map((record) => (
                <div className="cubby-pickup" key={record.id}>
                  <strong>
                    From {record.kind === "washer" ? "Washer" : "Dryer"}{" "}
                    {record.machineId}
                  </strong>
                  <span>
                    Sitting {clock(now - (record.movedAt ?? record.endsAt))}
                  </span>
                  <button
                    className="primary-button"
                    onClick={() => onCollect(record.id)}
                    aria-label={`I picked up my laundry from ${cubby}, ${record.machineId}`}
                  >
                    I picked it up
                  </button>
                </div>
              ))}
              {moves.length > 0 && (
                <>
                  <p className="cubby-log-label">Move history</p>
                  <ul>
                    {moves.map((event) => {
                      const record = records.find(
                        (record) =>
                          record.machineId === event.machineId &&
                          record.movedTo === cubby &&
                          Math.abs((record.movedAt ?? 0) - event.time) < 1000,
                      );
                      return (
                        <li key={event.id}>
                          <strong>
                            {event.machineId!.startsWith("W")
                              ? "Washer"
                              : "Dryer"}{" "}
                            {event.machineId}
                          </strong>
                          <span>
                            {record?.collectedAt !== undefined
                              ? "Picked up"
                              : `Moved ${clock(now - event.time)} ago`}
                          </span>
                          <time dateTime={new Date(event.time).toISOString()}>
                            {new Date(event.time).toLocaleString([], {
                              month: "short",
                              day: "numeric",
                              hour: "numeric",
                              minute: "2-digit",
                            })}
                          </time>
                        </li>
                      );
                    })}
                  </ul>
                </>
              )}
              {!yours.length && !moves.length && <p>No moves recorded</p>}
            </section>
          );
        })}
      </div>
    </GlassDialog>
  );
}
