"use client";
import { useEffect, useState } from "react";
import { MotionConfig, motion } from "framer-motion";
import { ArrowUpRight, Shirt, Check, QrCode, Plus } from "lucide-react";
import { nextMachineStatus } from "@/lib/machine-view";
import { MINUTE, statusOf } from "@/lib/laundry";
import { advanceAlerts, watchMachine } from "@/lib/alerts";
import {
  freshLaundry,
  restoreLaundry,
  STORAGE,
  type LaundryData,
} from "@/lib/laundry-storage";
import { loadRecord } from "@/lib/load-history";
import { CubbiesDialog } from "./cubbies-dialog";
import { LoadHistory } from "./load-history";
import { BottomNav, type Tab } from "@/components/ui/bottom-nav";
import { RoomBrowser, type RoomView } from "./room-browser";
import { LoadSummaryCard } from "./load-summary-card";
import { MachineBottomSheet } from "./machine-bottom-sheet";
import {
  DoLaundryDialog,
  type BrowsePreset,
  type BrowseKind,
} from "./do-laundry-dialog";
import { AlertsPage } from "./alerts-page";
import { PwaControls } from "@/components/pwa/pwa-controls";
export function LaundryApp() {
  const [data, setData] = useState<LaundryData>({
    machines: [],
    activity: [],
    watches: [],
    lastRead: 0,
    history: [],
  });
  const [now, setNow] = useState(0);
  const [ready, setReady] = useState(false);
  const [roomExpanded, setRoomExpanded] = useState(false);
  const [roomView, setRoomView] = useState<RoomView>("map");
  const [browse, setBrowse] = useState({
    preset: "all" as BrowsePreset,
    kind: "all" as BrowseKind,
    key: 0,
  });
  const [cubbiesOpen, setCubbiesOpen] = useState(false);
  const [quickStart, setQuickStart] = useState(false);
  const [tab, setTab] = useState<Tab>("room");
  const [selected, setSelected] = useState<string | null>(null);
  const [toast, setToast] = useState("");
  const { machines, activity, watches } = data;
  useEffect(() => {
    const time = Date.now();
    setNow(time);
    try {
      setData(restoreLaundry(localStorage.getItem(STORAGE), time));
    } catch {
      setData(freshLaundry(time));
    }
    setReady(true);
    const refreshClock = () => setNow(Date.now());
    const onVisible = () => {
      if (document.visibilityState === "visible") refreshClock();
    };
    const timer = setInterval(refreshClock, 1000);
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("pageshow", refreshClock);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("pageshow", refreshClock);
    };
  }, []);
  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE, JSON.stringify(data));
    } catch {
      /* Usable without storage. */
    }
  }, [data, ready]);
  useEffect(() => {
    if (!ready) return;
    setData((previous) => {
      const result = advanceAlerts(previous.machines, previous.watches, now);
      if (!result.changed && !result.events.length) return previous;
      const events = result.events.filter(
        (event) => !previous.activity.some((a) => a.id === event.id),
      );
      return {
        ...previous,
        watches: result.watches,
        activity: [...events, ...previous.activity],
      };
    });
  }, [now, ready, machines, watches]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 4000);
    return () => clearTimeout(timer);
  }, [toast]);
  const ownLoads = machines.filter((m) => m.owner === "you");
  const available = (kind: "washer" | "dryer") =>
    machines.filter((m) => m.kind === kind && m.endsAt === null).length;
  const selectMachine = (id: string) => {
    setQuickStart(false);
    setSelected(id);
  };
  const current = machines.find((m) => m.id === selected);
  function start() {
    if (!current || current.endsAt !== null) return;
    const time = Date.now();
    const started = {
      ...current,
      owner: "you" as const,
      endsAt: time + (current.kind === "washer" ? 30 : 45) * MINUTE,
    };
    setData((previous) => ({
      ...previous,
      machines: previous.machines.map((m) =>
        m.id === started.id ? started : m,
      ),
      history: [...previous.history, loadRecord(started)!],
      watches: [
        ...previous.watches.filter((w) => w.machineId !== started.id),
        watchMachine(started, time),
      ],
    }));
    setSelected(null);
    setToast(`${current.id} started. Alerts are on for your load.`);
  }
  function collect() {
    if (
      !current ||
      current.owner !== "you" ||
      current.endsAt === null ||
      current.endsAt > Date.now()
    )
      return;
    setData((previous) => ({
      ...previous,
      history: previous.history.map((record) =>
        record.machineId === current.id && record.endsAt === current.endsAt
          ? { ...record, collectedAt: Date.now() }
          : record,
      ),
      machines: previous.machines.map((m) =>
        m.id === current.id ? { ...m, owner: undefined, endsAt: null } : m,
      ),
    }));
    setSelected(null);
    setToast("Collected. This machine is available again.");
  }
  function move(cubby: string) {
    if (!current || statusOf(current, Date.now()) !== "move") return;
    setData((previous) => ({
      ...previous,
      activity: [
        {
          id: crypto.randomUUID(),
          text: `Your laundry from ${current.id} was moved to ${cubby}.`,
          time: Date.now(),
          status: "move",
          machineId: current.id,
          location: cubby,
          recipient: current.owner === "you" ? "you" : "neighbor",
          category: "loads",
        },
        ...previous.activity,
      ],
      history: previous.history.map((record) =>
        record.machineId === current.id && record.endsAt === current.endsAt
          ? { ...record, movedTo: cubby, movedAt: Date.now() }
          : record,
      ),
      machines: previous.machines.map((m) =>
        m.id === current.id ? { ...m, owner: undefined, endsAt: null } : m,
      ),
    }));
    setSelected(null);
    setToast(`Move to ${cubby} logged. ${current.id} is now free.`);
  }
  function toggleWatch(id: string) {
    const machine = machines.find((m) => m.id === id);
    if (!machine) return;
    setData((previous) => ({
      ...previous,
      watches: previous.watches.some((w) => w.machineId === id)
        ? previous.watches.filter((w) => w.machineId !== id)
        : [...previous.watches, watchMachine(machine, Date.now())],
    }));
  }
  function browseMachines(kind: BrowseKind) {
    const free = nextMachineStatus(machines, Date.now(), kind) === "available";
    setQuickStart(false);
    setTab("room");
    setRoomView(free ? "map" : "list");
    setRoomExpanded(true);
    setBrowse((previous) => ({
      preset: free ? "available" : "next",
      kind,
      key: previous.key + 1,
    }));
    requestAnimationFrame(() =>
      document
        .querySelector<HTMLButtonElement>(".expand-room")
        ?.focus({ preventScroll: true }),
    );
  }
  return (
    <MotionConfig reducedMotion="user">
      <div
        className={`app-shell ${tab === "room" && roomExpanded ? "is-room-expanded" : ""}`}
      >
        <main id="app-content">
          {tab === "room" && (
            <>
              <section className="room-title-block silliman-intro">
                <span className="room-greeting">
                  {ready
                    ? `Good ${new Date(now).getHours() < 12 ? "morning" : new Date(now).getHours() < 17 ? "afternoon" : "evening"}, Timothy.`
                    : "Hello, Timothy."}
                </span>
                <div className="room-identity-row">
                  <h1>Silliman Basement</h1>
                  <span>Entryway M</span>
                </div>
                <span className="room-location">
                  {ready
                    ? `${available("washer")} washers · ${available("dryer")} dryer${available("dryer") === 1 ? "" : "s"} free`
                    : "Getting ready…"}
                </span>
                <button
                  className="primary-button do-laundry-button"
                  disabled={!ready}
                  onClick={() => setQuickStart(true)}
                >
                  <span>
                    <Plus size={19} /> Do laundry
                  </span>
                  <QrCode size={21} />
                </button>
              </section>
              <div id="room-browser">
                {ready ? (
                  <RoomBrowser
                    expanded={roomExpanded}
                    onExpanded={setRoomExpanded}
                    key={browse.key}
                    preset={browse.preset}
                    presetKind={browse.kind}
                    view={roomView}
                    onView={setRoomView}
                    machines={machines}
                    now={now}
                    selected={selected}
                    onSelect={selectMachine}
                    onCubbies={() => setCubbiesOpen(true)}
                  />
                ) : (
                  <div className="loading-room">Getting the room ready…</div>
                )}
              </div>
              {ownLoads.length > 0 && (
                <section className="home-loads" aria-label="Your loads">
                  <h2>Your loads</h2>
                  {ownLoads.map((machine) => (
                    <LoadSummaryCard
                      key={machine.id}
                      machine={machine}
                      now={now}
                      watching={watches.some((w) => w.machineId === machine.id)}
                      onSelect={selectMachine}
                      onToggleAlerts={toggleWatch}
                    />
                  ))}
                </section>
              )}
            </>
          )}
          {tab === "loads" && (
            <>
              <div className="page-intro">
                <div className="eyebrow">SILLIMAN · ENTRYWAY M</div>
                <h1>My loads</h1>
                <p>A little less laundry to think about.</p>
              </div>
              {ownLoads.length ? (
                ownLoads.map((machine) => (
                  <LoadSummaryCard
                    key={machine.id}
                    machine={machine}
                    now={now}
                    watching={watches.some((w) => w.machineId === machine.id)}
                    onSelect={selectMachine}
                    onToggleAlerts={toggleWatch}
                  />
                ))
              ) : (
                <div className="empty-state">
                  <Shirt size={42} />
                  <h2>A clean slate.</h2>
                  <p>Find a machine to start your next load.</p>
                  <button
                    className="primary-button"
                    onClick={() => setQuickStart(true)}
                  >
                    Do laundry <ArrowUpRight size={18} />
                  </button>
                </div>
              )}
              <LoadHistory records={data.history} now={now} />
              <details className="demo-tools">
                <summary>Try the prototype</summary>
                <p>Simulated timers and in-app alerts.</p>
                <button
                  onClick={() => {
                    setData((previous) => ({
                      ...previous,
                      machines: previous.machines.map((m) =>
                        m.endsAt === null
                          ? m
                          : { ...m, endsAt: m.endsAt - 5 * MINUTE },
                      ),
                      history: previous.history.map((record) =>
                        previous.machines.some(
                          (m) =>
                            m.owner === "you" &&
                            m.id === record.machineId &&
                            m.endsAt === record.endsAt,
                        )
                          ? {
                              ...record,
                              startedAt: record.startedAt - 5 * MINUTE,
                              endsAt: record.endsAt - 5 * MINUTE,
                            }
                          : record,
                      ),
                      watches: previous.watches.map((w) => ({
                        ...w,
                        cycleEnd:
                          w.cycleEnd === null ? null : w.cycleEnd - 5 * MINUTE,
                      })),
                    }));
                    setNow(Date.now());
                  }}
                >
                  Skip 5 minutes on all machines
                </button>
                <button
                  disabled={!ownLoads.length}
                  onClick={() => {
                    const machine = ownLoads[0];
                    if (!machine || machine.endsAt === null) return;
                    const time = Date.now();
                    const end = Math.min(machine.endsAt, time - 8 * MINUTE);
                    setData((previous) => ({
                      ...previous,
                      machines: previous.machines.map((m) =>
                        m.id === machine.id
                          ? { ...m, owner: undefined, endsAt: null }
                          : m,
                      ),
                      watches: previous.watches.filter(
                        (w) => w.machineId !== machine.id,
                      ),
                      history: previous.history.map((r) =>
                        r.machineId === machine.id &&
                        r.endsAt === machine.endsAt
                          ? {
                              ...r,
                              endsAt: end,
                              startedAt:
                                end -
                                (machine.kind === "washer" ? 30 : 45) * MINUTE,
                              movedTo: "Cubby B",
                              movedAt: time,
                            }
                          : r,
                      ),
                      activity: [
                        {
                          id: crypto.randomUUID(),
                          text: `Your laundry from ${machine.id} was moved to Cubby B.`,
                          time,
                          status: "move",
                          machineId: machine.id,
                          location: "Cubby B",
                          recipient: "you",
                          category: "loads",
                        },
                        ...previous.activity,
                      ],
                    }));
                    setToast(`${machine.id} moved to Cubby B.`);
                  }}
                >
                  Simulate my load moved to Cubby B
                </button>
                <button
                  onClick={() => {
                    setData(freshLaundry(Date.now()));
                    setNow(Date.now());
                    setToast("Demo reset.");
                  }}
                >
                  Reset demo
                </button>
              </details>
            </>
          )}
          {tab === "alerts" && (
            <AlertsPage
              machines={machines}
              watches={watches}
              activity={activity}
              now={now}
              onSelect={selectMachine}
              onUnwatch={toggleWatch}
              onRead={(id) =>
                setData((previous) => ({
                  ...previous,
                  activity: previous.activity.map((event) =>
                    event.id === id && event.readAt === undefined
                      ? { ...event, readAt: Date.now() }
                      : event,
                  ),
                }))
              }
            />
          )}
        </main>
        <PwaControls />
        <BottomNav
          active={tab}
          onChange={(next) => {
            setTab(next);
            document
              .getElementById("app-content")
              ?.scrollTo({ top: 0, behavior: "instant" });
          }}
          unread={
            activity.filter(
              (a) => a.recipient === "you" && a.readAt === undefined,
            ).length
          }
        />
        {cubbiesOpen && (
          <CubbiesDialog
            activity={activity}
            now={now}
            onClose={() => setCubbiesOpen(false)}
          />
        )}
        {quickStart && (
          <DoLaundryDialog
            onClose={() => setQuickStart(false)}
            onSelect={selectMachine}
            onBrowse={browseMachines}
          />
        )}
        {current && !quickStart && (
          <MachineBottomSheet
            key={current.id}
            machine={current}
            now={now}
            onClose={() => setSelected(null)}
            onStart={start}
            onCollect={collect}
            onMove={move}
            watching={watches.some((w) => w.machineId === current.id)}
            onWatch={() => toggleWatch(current.id)}
          />
        )}
        {toast && (
          <motion.div
            role="status"
            className="toast"
            initial={{ y: 15, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
          >
            <Check size={18} />
            {toast}
          </motion.div>
        )}
      </div>
    </MotionConfig>
  );
}
