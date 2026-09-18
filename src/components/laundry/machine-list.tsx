"use client";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { Machine } from "@/types/laundry";
import { statuses, statusOf } from "@/lib/laundry";
import {
  groupOf,
  groupLabels,
  rowTiming,
  type MachineGroup,
} from "@/lib/machine-view";
import { statusIcons } from "./status-visual";
import { CyclePie } from "./cycle-pie";
import { OwnershipOutline } from "./ownership-outline";
export function MachineRow({
  machine,
  now,
  onSelect,
  selected = false,
}: {
  machine: Machine;
  selected?: boolean;
  now: number;
  onSelect: (id: string) => void;
}) {
  const status = statusOf(machine, now),
    Icon = statusIcons[status],
    timing = rowTiming(machine, now);
  return (
    <motion.li
      layout="position"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      className={`machine-row kind-${machine.kind} state-${status} ${selected ? "is-selected" : ""} ${machine.owner === "you" ? "is-owned" : ""}`}
    >
      <button
        onClick={() => onSelect(machine.id)}
        aria-pressed={selected}
        aria-haspopup="dialog"
        aria-label={`${machine.kind} ${machine.id}, ${statuses[status].label}, ${timing.text}${machine.owner === "you" ? ", your load" : ""}`}
      >
        <span className="row-identity">
          <strong>{machine.id}</strong>
          <small>
            {machine.kind === "washer" ? "Washer" : "Dryer"}
            {machine.owner === "you" && <em>Yours</em>}
          </small>
        </span>
        <span className="row-details">
          <span className="row-status">
            {status === "grace" ? (
              <CyclePie machine={machine} now={now} />
            ) : (
              <Icon size={14} />
            )}
            {statuses[status].label}
          </span>
          <span className="row-time">{timing.text}</span>
          {machine.endsAt !== null && (
            <span
              className="row-progress"
              role="progressbar"
              aria-label={timing.label}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(timing.progress * 100)}
              aria-valuetext={timing.text}
            >
              <motion.span
                initial={false}
                animate={{ width: `${timing.progress * 100}%` }}
                transition={{ duration: 0.25 }}
              />
            </span>
          )}
        </span>
        <ChevronRight size={16} />
      </button>
      {machine.owner === "you" && <OwnershipOutline radius={21} />}
    </motion.li>
  );
}
export function MachineList({
  machines,
  now,
  onSelect,
  onClear,
  ranked = false,
  selected,
}: {
  machines: Machine[];
  now: number;
  onSelect: (id: string) => void;
  onClear: () => void;
  ranked?: boolean;
  selected?: string | null;
}) {
  const [collapsed, setCollapsed] = useState<MachineGroup[]>([]);
  if (ranked && machines.length)
    return (
      <ul className="ranked-machine-list">
        {machines.map((machine) => (
          <MachineRow
            key={machine.id}
            selected={selected === machine.id}
            machine={machine}
            now={now}
            onSelect={onSelect}
          />
        ))}
      </ul>
    );
  return (
    <div className="machine-list">
      {!machines.length ? (
        <div className="list-empty">
          <h2>No machines match</h2>
          <p>Try a different type or status.</p>
          <button onClick={onClear}>Clear filters</button>
        </div>
      ) : (
        (Object.keys(groupLabels) as MachineGroup[]).map((group) => {
          const rows = machines.filter((m) => groupOf(m, now) === group);
          if (!rows.length) return null;
          const closed = collapsed.includes(group);
          return (
            <section className="machine-group" key={group}>
              <button
                className="group-heading"
                aria-expanded={!closed}
                aria-controls={`group-${group}`}
                onClick={() =>
                  setCollapsed((c) =>
                    closed ? c.filter((g) => g !== group) : [...c, group],
                  )
                }
              >
                <span>
                  {groupLabels[group]}
                  <b>{rows.length}</b>
                </span>
                <ChevronDown
                  size={17}
                  style={{ transform: closed ? "rotate(-90deg)" : undefined }}
                />
              </button>
              <AnimatePresence initial={false}>
                {!closed && (
                  <motion.ul
                    id={`group-${group}`}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <AnimatePresence initial={false}>
                      {rows.map((machine) => (
                        <MachineRow
                          key={machine.id}
                          selected={selected === machine.id}
                          machine={machine}
                          now={now}
                          onSelect={onSelect}
                        />
                      ))}
                    </AnimatePresence>
                  </motion.ul>
                )}
              </AnimatePresence>
            </section>
          );
        })
      )}
    </div>
  );
}
