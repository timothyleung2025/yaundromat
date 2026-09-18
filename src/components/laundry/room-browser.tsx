"use client";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Map,
  List,
  SlidersHorizontal,
  ArrowDownUp,
  X,
  Maximize2,
  Minimize2,
} from "lucide-react";
import type { Machine } from "@/types/laundry";
import { statuses } from "@/lib/laundry";
import {
  selectMachines,
  nextMachineStatus,
  emptyFilters,
  sortOptions,
  type MachineFilters,
  type MachineSort,
} from "@/lib/machine-view";
import { RoomMap } from "./room-map";
import { MachineList } from "./machine-list";
import { RoomOptionsSheet } from "./room-options-sheet";
import type { BrowsePreset } from "./do-laundry-dialog";
export type RoomView = "map" | "list";
export function RoomBrowser({
  machines,
  now,
  selected,
  onSelect,
  onCubbies,
  view,
  onView,
  preset = "all",
  presetKind = "all",
  expanded,
  onExpanded,
}: {
  preset?: BrowsePreset;
  presetKind?: MachineFilters["kind"];
  expanded: boolean;
  onExpanded: (expanded: boolean) => void;
  machines: Machine[];
  now: number;
  selected: string | null;
  onSelect: (id: string) => void;
  onCubbies: () => void;
  view: RoomView;
  onView: (view: RoomView) => void;
}) {
  const [chosenFilters, setChosenFilters] = useState<MachineFilters>(
      preset === "available"
        ? { kind: presetKind, statuses: ["available"] }
        : preset === "next"
          ? {
              kind: presetKind,
              statuses: [nextMachineStatus(machines, now, presetKind)],
            }
          : emptyFilters,
    ),
    [sort, setSort] = useState<MachineSort>(
      preset === "soonest" || preset === "next" ? "soonest" : "number",
    ),
    [options, setOptions] = useState<"filter" | "sort" | null>(null);
  const [typeFirst, setTypeFirst] = useState<Machine["kind"] | undefined>(
    preset === "next" ? undefined : presetKind === "dryer" ? "dryer" : "washer",
  );
  const [followAvailability, setFollowAvailability] = useState(
    preset === "next",
  );
  const filters: MachineFilters = followAvailability
    ? {
        ...chosenFilters,
        statuses: [nextMachineStatus(machines, now, chosenFilters.kind)],
      }
    : chosenFilters;
  const setFilters = (next: MachineFilters) => {
    setFollowAvailability(false);
    setChosenFilters(next);
  };
  const expandButton = useRef<HTMLButtonElement>(null);
  const scrollPosition = useRef(0);
  const card = useRef<HTMLDivElement>(null);
  const previousBounds = useRef<DOMRect | null>(null);
  const expansionAnimation = useRef<Animation | null>(null);
  const captureBounds = () => {
    previousBounds.current = card.current?.getBoundingClientRect() ?? null;
    expansionAnimation.current?.cancel();
  };
  useLayoutEffect(() => {
    const element = card.current;
    const from = previousBounds.current;
    previousBounds.current = null;
    if (!element || !from) return;
    if (!expanded) {
      document
        .getElementById("app-content")
        ?.scrollTo({ top: scrollPosition.current, behavior: "instant" });
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const to = element.getBoundingClientRect();
    expansionAnimation.current = element.animate(
      [
        {
          transform: `translate(${from.x - to.x}px, ${from.y - to.y}px) scale(${from.width / to.width}, ${from.height / to.height})`,
          borderRadius: expanded ? "28px" : "0px",
        },
        {
          transform: "translate(0, 0) scale(1, 1)",
          borderRadius: expanded ? "0px" : "28px",
        },
      ],
      { duration: 420, easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
    );
    return () => expansionAnimation.current?.cancel();
  }, [expanded]);
  useEffect(() => {
    if (!expanded) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !document.querySelector("dialog[open]")) {
        event.preventDefault();
        captureBounds();
        onExpanded(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      requestAnimationFrame(() => {
        document
          .getElementById("app-content")
          ?.scrollTo({ top: scrollPosition.current, behavior: "instant" });
        expandButton.current?.focus({ preventScroll: true });
      });
    };
  }, [expanded, onExpanded]);
  const toggleExpanded = () => {
    if (!expanded)
      scrollPosition.current =
        document.getElementById("app-content")?.scrollTop ?? 0;
    captureBounds();
    onExpanded(!expanded);
  };
  const results = selectMachines(machines, now, filters, sort, typeFirst),
    activeCount = filters.statuses.length + Number(filters.kind !== "all");
  const chips = [
    ...(filters.kind === "all"
      ? []
      : [
          {
            key: "kind",
            label: filters.kind === "washer" ? "Washers" : "Dryers",
            remove: () => setFilters({ ...filters, kind: "all" }),
          },
        ]),
    ...filters.statuses.map((s) => ({
      key: s,
      label: statuses[s].label,
      remove: () =>
        setFilters({
          ...filters,
          statuses: filters.statuses.filter((x) => x !== s),
        }),
    })),
  ];
  return (
    <div ref={card} className={`room-browser ${expanded ? "is-expanded" : ""}`}>
      {expanded && (
        <div className="expanded-room-heading">
          <h1>Silliman Basement</h1>
          <span>Entryway M</span>
        </div>
      )}
      <div className="browser-controls">
        <div className="browser-toolbar">
          <div
            className="view-segment"
            role="group"
            aria-label="Room view"
            data-view={view}
          >
            <span className="view-highlight" aria-hidden="true" />
            {(["map", "list"] as const).map((v) => {
              const Icon = v === "map" ? Map : List;
              return (
                <button
                  key={v}
                  aria-label={v === "map" ? "Map" : "List"}
                  aria-pressed={view === v}
                  onClick={() => onView(v)}
                >
                  <Icon size={16} />
                  <span>{v === "map" ? "Map" : "List"}</span>
                </button>
              );
            })}
          </div>
          <button
            className="browser-tool filter-room"
            aria-label="Filter machines"
            aria-haspopup="dialog"
            onClick={() => setOptions("filter")}
          >
            <SlidersHorizontal size={16} />
            {activeCount > 0 && <i className="filter-count">{activeCount}</i>}
          </button>
          <button
            className={`browser-tool sort-room ${sort !== "number" || typeFirst !== "washer" ? "has-sort" : ""}`}
            aria-label="Sort machines"
            aria-haspopup="dialog"
            onClick={() => setOptions("sort")}
          >
            <ArrowDownUp size={16} />
          </button>
          <button
            ref={expandButton}
            className="browser-tool expand-room"
            onClick={toggleExpanded}
            aria-label={expanded ? "Exit full screen" : `Full screen ${view}`}
            aria-expanded={expanded}
            title={expanded ? "Exit full screen" : `Full screen ${view}`}
          >
            {expanded ? <Minimize2 size={17} /> : <Maximize2 size={17} />}
          </button>
        </div>
        {chips.length > 0 && (
          <div className="filter-chips">
            {chips.map((c) => (
              <motion.button
                layout
                key={c.key}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={c.remove}
                aria-label={`Remove ${c.label} filter`}
              >
                {c.label}
                <X size={13} />
              </motion.button>
            ))}
            <button
              className="clear-filters"
              onClick={() => setFilters(emptyFilters)}
            >
              Clear filters
            </button>
          </div>
        )}
        {(activeCount > 0 || view === "list") && (
          <div className="browser-summary">
            <span>
              {results.length} of {machines.length} machines
            </span>
            {view === "list" && (
              <span>
                {sortOptions.find(([s]) => s === sort)?.[1]} ·{" "}
                {typeFirst
                  ? `${typeFirst === "washer" ? "Washers" : "Dryers"} first`
                  : "Next available"}
              </span>
            )}
          </div>
        )}
        {view === "list" && sort === "soonest" && (
          <p className="sort-estimate">
            Soonest uses cycle end + pickup window. Collection may happen
            earlier.
          </p>
        )}
      </div>
      <motion.div
        className="browser-results"
        key={view}
        initial={{ opacity: 0.5 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.16 }}
      >
        {view === "map" ? (
          <>
            <RoomMap
              machines={machines}
              matchingIds={results.map((m) => m.id)}
              now={now}
              selected={selected}
              onSelect={onSelect}
              onCubbies={onCubbies}
            />
            {!results.length && (
              <div className="list-empty">
                <p>No machines match these filters.</p>
                <button onClick={() => setFilters(emptyFilters)}>
                  Clear filters
                </button>
              </div>
            )}
          </>
        ) : (
          <MachineList
            selected={selected}
            ranked
            machines={results}
            now={now}
            onSelect={onSelect}
            onClear={() => setFilters(emptyFilters)}
          />
        )}
      </motion.div>
      {options && (
        <RoomOptionsSheet
          mode={options}
          filters={filters}
          sort={sort}
          typeFirst={typeFirst}
          onTypeFirst={setTypeFirst}
          onFilters={setFilters}
          onSort={setSort}
          onClose={() => setOptions(null)}
        />
      )}
    </div>
  );
}
