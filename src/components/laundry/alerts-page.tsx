import { machineTime, clock } from "@/lib/laundry";
import { Bell } from "lucide-react";
import type { Activity, Machine } from "@/types/laundry";
import type { MachineWatch } from "@/lib/alerts";
import { LoadSummaryCard } from "./load-summary-card";
export function AlertsPage({
  machines,
  watches,
  activity,
  now,
  onSelect,
  onUnwatch,
  onRead,
}: {
  machines: Machine[];
  watches: MachineWatch[];
  activity: Activity[];
  now: number;
  onSelect: (id: string) => void;
  onUnwatch: (id: string) => void;
  onRead: (id: string) => void;
}) {
  return (
    <>
      <div className="page-intro">
        <div className="eyebrow">STAY IN THE LOOP</div>
        <h1>Alerts</h1>
        <p>Your loads and the machines you’re waiting for.</p>
      </div>
      {(["loads", "watching"] as const).map((category) => {
        const subscriptions = watches.filter((w) => w.category === category);
        const events = activity.filter(
          (a) => a.recipient === "you" && a.category === category,
        );
        return (
          <section className="alerts-section" key={category}>
            <h2>
              {category === "loads" ? "Your loads" : "Other machines"}
              <span>{subscriptions.length}</span>
            </h2>
            {subscriptions.map((watch) => {
              const machine = machines.find((m) => m.id === watch.machineId);
              if (!machine) return null;
              return (
                <LoadSummaryCard
                  key={machine.id}
                  machine={machine}
                  now={now}
                  watching={true}
                  onSelect={onSelect}
                  onToggleAlerts={onUnwatch}
                />
              );
            })}
            {!subscriptions.length && (
              <p className="alerts-empty">
                {category === "loads"
                  ? "Start a load to follow its progress here."
                  : "Tap “Get alerts” on a machine you’re waiting for."}
              </p>
            )}
            {events.map((event) => {
              const machine = machines.find((m) => m.id === event.machineId);
              return (
                <button
                  onClick={() => onRead(event.id)}
                  aria-label={`${event.readAt === undefined ? "Unread" : "Read"}: ${event.text}`}
                  className={`alert-event state-${event.status ?? "grace"} ${event.readAt === undefined ? "is-unread" : "is-read"}`}
                  key={event.id}
                >
                  <Bell size={16} />
                  <span className="alert-event-content">
                    <span className="alert-read-label">
                      {event.readAt === undefined ? "Unread" : "Read"}
                    </span>
                    <span className="alert-event-text">{event.text}</span>
                    {machine && (
                      <small className="alert-machine-timing">
                        Now: {machineTime(machine, now)}
                      </small>
                    )}
                    <time dateTime={new Date(event.time).toISOString()}>
                      {clock(now - event.time)} ago ·{" "}
                      {new Date(event.time).toLocaleTimeString([], {
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </time>
                  </span>
                </button>
              );
            })}
          </section>
        );
      })}
      <p className="alerts-footnote">
        Alerts appear here while the app is open. Machine times are simulated.
      </p>
    </>
  );
}
