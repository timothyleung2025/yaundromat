"use client";
import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { X, Check } from "lucide-react";
import { statuses } from "@/lib/laundry";
import type { Machine, MachineStatus } from "@/types/laundry";
import {
  emptyFilters,
  sortOptions,
  type MachineFilters,
  type MachineSort,
} from "@/lib/machine-view";
export function RoomOptionsSheet({
  mode,
  filters,
  sort,
  typeFirst,
  onTypeFirst,
  onFilters,
  onSort,
  onClose,
}: {
  mode: "filter" | "sort";
  filters: MachineFilters;
  sort: MachineSort;
  typeFirst?: Machine["kind"];
  onTypeFirst: (kind: Machine["kind"]) => void;
  onFilters: (f: MachineFilters) => void;
  onSort: (s: MachineSort) => void;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = dialog.current;
    const focus = document.activeElement as HTMLElement | null;
    d?.showModal();
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      d?.close();
      document.body.style.overflow = old;
      focus?.focus({ preventScroll: true });
    };
  }, []);
  return (
    <dialog
      ref={dialog}
      className="room-options-sheet"
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      aria-labelledby="options-title"
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        <button
          className="sheet-close"
          onClick={onClose}
          aria-label="Close room options"
        >
          <X size={22} />
        </button>
        <h2 id="options-title">
          {mode === "filter" ? "Filter machines" : "Sort machines"}
        </h2>
        {mode === "filter" ? (
          <>
            <fieldset>
              <legend>Machine type</legend>
              <div className="filter-types">
                {(["all", "washer", "dryer"] as const).map((kind) => (
                  <button
                    key={kind}
                    aria-pressed={filters.kind === kind}
                    onClick={() => onFilters({ ...filters, kind })}
                  >
                    {kind === "all"
                      ? "All"
                      : kind === "washer"
                        ? "Washers"
                        : "Dryers"}
                  </button>
                ))}
              </div>
            </fieldset>
            <fieldset>
              <legend>
                Status <small>Select any · no selection shows all</small>
              </legend>
              {(Object.keys(statuses) as MachineStatus[]).map((status) => (
                <label className={`filter-status state-${status}`} key={status}>
                  <input
                    type="checkbox"
                    checked={filters.statuses.includes(status)}
                    onChange={() =>
                      onFilters({
                        ...filters,
                        statuses: filters.statuses.includes(status)
                          ? filters.statuses.filter((s) => s !== status)
                          : [...filters.statuses, status],
                      })
                    }
                  />
                  <span className="filter-dot" />
                  {statuses[status].label}
                </label>
              ))}
            </fieldset>
            <div className="options-actions">
              <button onClick={() => onFilters(emptyFilters)}>
                Clear filters
              </button>
              <button className="options-done" onClick={onClose}>
                Show results
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="sort-help">
              Choose a machine type first, then the order within each type.
            </p>
            <div role="radiogroup" aria-label="Sort order">
              {sortOptions.map(([value, label]) => (
                <label className="sort-option" key={value}>
                  <input
                    type="radio"
                    name="machine-sort"
                    checked={sort === value}
                    onChange={() => onSort(value)}
                  />
                  <span>{label}</span>
                  {sort === value && <Check size={17} />}
                </label>
              ))}
            </div>
            <div
              className="sort-type-group"
              role="radiogroup"
              aria-label="Machine type priority"
            >
              {(["washer", "dryer"] as const).map((kind) => (
                <label className="sort-option" key={kind}>
                  <input
                    type="radio"
                    name="machine-type-priority"
                    checked={typeFirst === kind}
                    onChange={() => onTypeFirst(kind)}
                  />
                  <span>
                    {kind === "washer" ? "Washer first" : "Dryer first"}
                  </span>
                  {typeFirst === kind && <Check size={17} />}
                </label>
              ))}
            </div>
            <button className="options-done" onClick={onClose}>
              Done
            </button>
          </>
        )}
      </motion.div>
    </dialog>
  );
}
