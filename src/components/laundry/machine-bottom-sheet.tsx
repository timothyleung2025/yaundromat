"use client";
import { useState } from "react";
import { BellOff, BellRing, ArrowUpRight, Timer } from "lucide-react";
import type { Machine } from "@/types/laundry";
import { clock, GRACE, MINUTE, statusOf } from "@/lib/laundry";
import { StatusBadge } from "./status-visual";
import { CyclePie } from "./cycle-pie";
import { GlassDialog } from "@/components/ui/glass-dialog";
export function MachineBottomSheet({
  machine,
  now,
  onClose,
  onStart,
  onCollect,
  onMove,
  watching,
  onWatch,
}: {
  machine: Machine;
  now: number;
  onClose: () => void;
  onStart: () => void;
  onCollect: () => void;
  onMove: (cubby: string) => void;
  watching: boolean;
  onWatch: () => void;
}) {
  const [cubby, setCubby] = useState("Cubby B");
  const status = statusOf(machine, now);
  const running = status === "running";
  const duration = machine.kind === "washer" ? 30 : 45;
  return (
    <GlassDialog
      titleId="machine-title"
      onClose={onClose}
      className={`machine-dialog state-${status} ${machine.owner === "you" ? "is-owned" : ""}`}
    >
      <span className="dialog-eyebrow">
        {machine.owner === "you" ? "YOUR LOAD" : "SILLIMAN · ENTRYWAY M"}
      </span>
      <h2 id="machine-title">
        {machine.kind === "washer" ? "Washer" : "Dryer"} {machine.id}
      </h2>
      <StatusBadge status={status} />
      <div className="machine-quick-status">
        <CyclePie machine={machine} now={now} />
        <div>
          <strong>
            {status === "available"
              ? "Ready"
              : running
                ? clock(machine.endsAt! - now)
                : "Finished"}
          </strong>
          <span>
            {status === "available"
              ? `${duration} minute cycle`
              : running
                ? "remaining"
                : status === "move"
                  ? "Ready for pickup or a move"
                  : `${clock(machine.endsAt! + GRACE - now)} left in Pickup Window`}
          </span>
        </div>
      </div>
      {(status === "grace" || status === "move") && (
        <div className="finished-stopwatch">
          <Timer size={18} aria-hidden="true" />
          <span>
            Sitting for <strong>{clock(now - machine.endsAt!)}</strong>
          </span>
        </div>
      )}
      {machine.endsAt !== null && (
        <dl className="machine-cycle-times">
          <div>
            <dt>Started</dt>
            <dd>
              <CycleTimestamp
                time={machine.endsAt - duration * MINUTE}
                now={now}
              />
            </dd>
          </div>
          <div>
            <dt>{running ? "Estimated finish" : "Finished"}</dt>
            <dd>
              <CycleTimestamp time={machine.endsAt} now={now} />
            </dd>
          </div>
        </dl>
      )}
      {status === "move" && machine.owner !== "you" && (
        <div className="move-fields">
          <label htmlFor="cubby">Move finished laundry to</label>
          <select
            id="cubby"
            value={cubby}
            onChange={(e) => setCubby(e.target.value)}
          >
            {["Cubby A", "Cubby B", "Cubby C"].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
      )}
      <div className="quick-actions">
        {status === "available" && (
          <button className="primary-button" onClick={onStart}>
            Start my {machine.kind === "washer" ? "wash" : "dry"}{" "}
            <ArrowUpRight size={18} />
          </button>
        )}
        {machine.owner === "you" && !running && status !== "available" && (
          <button className="primary-button" onClick={onCollect}>
            I’ve collected my laundry
          </button>
        )}
        {status === "move" && machine.owner !== "you" && (
          <button className="primary-button" onClick={() => onMove(cubby)}>
            Moved to {cubby}
          </button>
        )}
        <button
          className={`alert-button ${watching ? "is-watching" : ""}`}
          onClick={onWatch}
          aria-pressed={watching}
        >
          {watching ? <BellRing size={18} /> : <BellOff size={18} />}
          {watching
            ? "Alerts on · tap to turn off"
            : "Get alerts on this machine"}
        </button>
      </div>
    </GlassDialog>
  );
}

function CycleTimestamp({ time, now }: { time: number; now: number }) {
  const date = new Date(time);
  const differentDay = date.toDateString() !== new Date(now).toDateString();
  return (
    <time dateTime={date.toISOString()} title={date.toLocaleString()}>
      {date.toLocaleString([], {
        ...(differentDay ? ({ month: "short", day: "numeric" } as const) : {}),
        hour: "numeric",
        minute: "2-digit",
      })}
    </time>
  );
}
