import { strict as assert } from "node:assert";
import { test } from "node:test";
import {
  statusOf,
  makeMachines,
  MINUTE,
  GRACE,
  clock,
  machineTime,
  machineProgress,
} from "./laundry";
const now = 10000000;
test("machine lifecycle has exact completion and grace boundaries", () => {
  const machine = { id: "W01", kind: "washer" as const, endsAt: now };
  assert.equal(statusOf({ ...machine, endsAt: null }, now), "available");
  assert.equal(statusOf(machine, now - 5 * MINUTE - 1), "running");
  assert.equal(statusOf(machine, now - 5 * MINUTE), "running");
  assert.equal(statusOf(machine, now), "grace");
  assert.equal(statusOf(machine, now + MINUTE), "grace");
  assert.equal(statusOf(machine, now + GRACE - 1), "grace");
  assert.equal(statusOf(machine, now + GRACE), "move");
});
test("demo includes fourteen unique machines and every lifecycle state", () => {
  const machines = makeMachines(now);
  assert.equal(new Set(machines.map((m) => m.id)).size, 14);
  assert.equal(new Set(machines.map((m) => statusOf(m, now))).size, 4);
  assert.equal(machines.filter((m) => m.owner === "you").length, 1);
});
test("timers never go negative and round up partial seconds", () => {
  assert.equal(clock(-1000), "0:00");
  assert.equal(clock(60001), "1:01");
});

test("state-specific timing and progress match the pickup window", () => {
  const machine = { id: "W01", kind: "washer" as const, endsAt: now };
  assert.equal(machineTime(machine, now - 3 * MINUTE), "3:00 left");
  assert.equal(
    machineTime(machine, now + 15000),
    "Sitting 0:15 · 4:45 left in Pickup Window",
  );
  assert.equal(
    machineTime(machine, now + 2 * MINUTE),
    "Sitting 2:00 · 3:00 left in Pickup Window",
  );
  assert.equal(
    machineTime(machine, now + 8 * MINUTE),
    "Okay to move · Sitting 8:00",
  );
  assert.equal(
    machineTime({ ...machine, owner: "you" }, now + GRACE),
    "Pickup overdue · Sitting 5:00",
  );
  assert.equal(
    machineTime(machine, now + GRACE - 1),
    "Sitting 5:00 · 0:01 left in Pickup Window",
  );
  assert.equal(machineProgress(machine, now - 15 * MINUTE), 0.5);
  assert.equal(machineProgress(machine, now), 1);
  assert.equal(machineProgress(machine, now + 2 * MINUTE), 0.6);
  assert.equal(machineProgress({ ...machine, endsAt: null }, now), 0);
});

import {
  emptyFilters,
  groupOf,
  selectMachines,
  rowTiming,
  nextMachineStatus,
  sortOptions,
} from "./machine-view";
test("groups follow lifecycle including exact grace expiry", () => {
  const m = { id: "W01", kind: "washer" as const, endsAt: now };
  assert.equal(groupOf({ ...m, endsAt: null }, now), "available");
  assert.equal(groupOf(m, now), "progress");
  assert.equal(groupOf(m, now + GRACE - 1), "progress");
  assert.equal(groupOf(m, now + GRACE), "expired");
  assert.equal(
    rowTiming(m, now + GRACE + 2 * MINUTE).text,
    "Okay to move · Sitting 7:00",
  );
  assert.equal(rowTiming(m, now + GRACE).progress, 1);
});
test("filters intersect type with any selected status without mutating source", () => {
  const machines = makeMachines(now),
    snapshot = JSON.stringify(machines);
  assert.deepEqual(
    selectMachines(
      machines,
      now,
      { kind: "washer", statuses: ["available", "running"] },
      "room",
    ).map((m) => m.id),
    ["W01", "W02", "W03", "W05", "W06", "W07", "W08", "W09", "W10"],
  );
  assert.equal(
    selectMachines(
      machines,
      now,
      { kind: "dryer", statuses: ["grace"] },
      "room",
    ).length,
    1,
  );
  for (const [sort] of sortOptions)
    assert.equal(selectMachines(machines, now, emptyFilters, sort).length, 14);
  assert.equal(JSON.stringify(machines), snapshot);
});
test("sorting uses cycle, pickup and overdue timestamps with stable ties", () => {
  const machines = makeMachines(now);
  const active = (sort: Parameters<typeof selectMachines>[3]) =>
    selectMachines(machines, now, emptyFilters, sort)
      .filter((m) => groupOf(m, now) === "progress")
      .map((m) => m.id);
  assert.equal(active("soonest")[0], "W04");
  assert.equal(active("most")[0], "W06");
  assert.equal(active("least")[0], "W04");
  assert.equal(
    selectMachines(machines, now, emptyFilters, "dryer")[0].kind,
    "dryer",
  );
  assert.deepEqual(
    selectMachines(machines, now, emptyFilters, "number")
      .slice(0, 4)
      .map((m) => m.id),
    ["W01", "D01", "W02", "D02"],
  );
  const expired = [
    { id: "D01", kind: "dryer" as const, endsAt: now - 10 * MINUTE },
    { id: "D02", kind: "dryer" as const, endsAt: now - 6 * MINUTE },
  ];
  assert.equal(
    selectMachines(expired, now, emptyFilters, "overdue")[0].id,
    "D01",
  );
  assert.equal(
    selectMachines(expired, now, emptyFilters, "recent")[0].id,
    "D02",
  );
});

import { roomSlots, resolveMachineCode } from "./silliman";
import { cycleRemaining } from "./laundry";
import { advanceAlerts, watchMachine } from "./alerts";
import { freshLaundry, restoreLaundry } from "./laundry-storage";
test("Silliman has ten washers, four far-right dryers, and unique physical slots", () => {
  assert.equal(roomSlots.filter((s) => s.kind === "washer").length, 10);
  assert.equal(roomSlots.filter((s) => s.kind === "dryer").length, 4);
  assert.ok(
    roomSlots.filter((s) => s.kind === "dryer").every((s) => s.column === 4),
  );
  assert.equal(new Set(roomSlots.map((s) => `${s.row}:${s.column}`)).size, 14);
});
test("machine lookup accepts printed IDs and QR URLs but rejects unknown IDs", () => {
  assert.equal(resolveMachineCode(" washer 3 "), "W03");
  assert.equal(resolveMachineCode("d04"), "D04");
  assert.equal(
    resolveMachineCode("https://laundry.example/?machine=W10"),
    "W10",
  );
  assert.equal(
    resolveMachineCode("https://laundry.example/machines/D02"),
    "D02",
  );
  for (const input of [
    "W11",
    "D05",
    "",
    "W00",
    "W01 extra",
    "javascript:alert(1)",
    "https://example.com/",
  ])
    assert.equal(resolveMachineCode(input), null);
});
test("pie timer shows remaining cycle fraction, clamped across lifecycle boundaries", () => {
  const m = { id: "W01", kind: "washer" as const, endsAt: now + 15 * MINUTE };
  assert.equal(cycleRemaining(m, now), 0.5);
  assert.equal(cycleRemaining(m, now - 30 * MINUTE), 1);
  assert.equal(cycleRemaining(m, now + 15 * MINUTE), 0);
  assert.equal(cycleRemaining({ ...m, endsAt: null }, now), 0);
  assert.equal(cycleRemaining({ ...m, kind: "dryer" }, now), 1 / 3);
});
test("watched cycles notify once when finished and again only when actually free", () => {
  const machine = {
    id: "W02",
    kind: "washer" as const,
    owner: "neighbor" as const,
    endsAt: now + MINUTE,
  };
  const watches = [watchMachine(machine, now)];
  const complete = advanceAlerts([machine], watches, now + MINUTE);
  assert.equal(complete.events.length, 1);
  assert.equal(complete.events[0].category, "watching");
  assert.equal(complete.events[0].status, "grace");
  assert.match(complete.events[0].text, /Waiting for pickup/);
  assert.equal(
    advanceAlerts([machine], complete.watches, now + MINUTE + 1000).events
      .length,
    0,
  );
  const expired = advanceAlerts([machine], complete.watches, now + 10 * MINUTE);
  assert.equal(expired.events.length, 0);
  const free = advanceAlerts(
    [{ ...machine, endsAt: null, owner: undefined }],
    expired.watches,
    now + 11 * MINUTE,
  );
  assert.equal(free.events.length, 1);
  assert.equal(free.events[0].status, "available");
  assert.equal(free.events[0].category, "watching");
});
test("own-load alerts, unsubscribe, and a later watched cycle stay separate", () => {
  const own = {
    id: "W03",
    kind: "washer" as const,
    owner: "you" as const,
    endsAt: now + MINUTE,
  };
  assert.equal(advanceAlerts([own], [], now + MINUTE).events.length, 0);
  const done = advanceAlerts([own], [watchMachine(own, now)], now + MINUTE);
  assert.equal(done.events[0].category, "loads");
  const later = {
    ...own,
    owner: "neighbor" as const,
    endsAt: now + 30 * MINUTE,
  };
  const restarted = advanceAlerts([later], done.watches, now + 2 * MINUTE);
  assert.equal(restarted.events.length, 0);
  assert.equal(restarted.watches[0].category, "watching");
  assert.equal(
    advanceAlerts([later], restarted.watches, later.endsAt).events[0].category,
    "watching",
  );
});
test("room state and watches survive reload; malformed or old-room data resets", () => {
  const data = freshLaundry(now);
  assert.deepEqual(
    restoreLaundry(JSON.stringify(data), now),
    JSON.parse(JSON.stringify(data)),
  );
  assert.equal(restoreLaundry("{oops", now).machines.length, 14);
  assert.equal(
    restoreLaundry(
      JSON.stringify({ ...data, machines: data.machines.slice(0, 10) }),
      now,
    ).machines.length,
    14,
  );
  assert.equal(
    restoreLaundry(
      JSON.stringify({ ...data, watches: [{ machineId: "W99" }] }),
      now,
    ).watches[0].machineId,
    "W03",
  );
});
test("soonest order puts genuinely free machines before occupied overdue machines", () => {
  const machines = [
    { id: "D01", kind: "dryer" as const, endsAt: now - 10 * MINUTE },
    { id: "W01", kind: "washer" as const, endsAt: null },
    { id: "W02", kind: "washer" as const, endsAt: now + MINUTE },
  ];
  assert.equal(
    selectMachines(machines, now, emptyFilters, "soonest")[0].id,
    "W01",
  );
});

test("legacy statuses migrate without losing loads, watches, or notification history", () => {
  const legacy = JSON.parse(JSON.stringify(freshLaundry(now)));
  const machine = legacy.machines.find((m: { id: string }) => m.id === "W03");
  machine.endsAt = now - MINUTE;
  legacy.watches[0] = {
    machineId: "W03",
    cycleEnd: machine.endsAt,
    lastStatus: "almost",
    category: "loads",
  };
  legacy.lastRead = 1234;
  const migrated = restoreLaundry(JSON.stringify(legacy), now);
  assert.equal(migrated.lastRead, 1234);
  assert.equal(
    migrated.machines.find((m) => m.id === "W03")?.endsAt,
    now - MINUTE,
  );
  assert.equal(migrated.watches[0].lastStatus, "running");
  const finished = advanceAlerts(migrated.machines, migrated.watches, now);
  assert.equal(finished.events.length, 1);
  assert.equal(finished.events[0].status, "grace");
  legacy.watches[0].lastStatus = "done";
  legacy.activity = [{ ...finished.events[0], status: "done" }];
  const alreadyNotified = restoreLaundry(JSON.stringify(legacy), now);
  assert.equal(alreadyNotified.activity[0].id, finished.events[0].id);
  assert.equal(alreadyNotified.activity[0].status, "grace");
  assert.equal(alreadyNotified.watches[0].lastStatus, "grace");
  assert.equal(
    advanceAlerts(alreadyNotified.machines, alreadyNotified.watches, now).events
      .length,
    0,
  );
});

test("type priority combines with number and soonest ordering", () => {
  const machines = makeMachines(now);
  for (const kind of ["washer", "dryer"] as const) {
    for (const sort of ["number", "soonest"] as const) {
      const combined = selectMachines(machines, now, emptyFilters, sort, kind);
      const preferred = machines.filter((m) => m.kind === kind);
      assert.deepEqual(
        combined.slice(0, preferred.length),
        selectMachines(preferred, now, emptyFilters, sort),
      );
      assert.ok(combined.slice(preferred.length).every((m) => m.kind !== kind));
    }
  }
});

test("availability fallback chooses the first nonempty tier for the requested type", () => {
  const machines = makeMachines(now);
  assert.equal(nextMachineStatus(machines, now, "all"), "available");
  const occupied = machines.map((m) => ({
    ...m,
    endsAt: m.endsAt ?? now + 20 * MINUTE,
  }));
  assert.equal(nextMachineStatus(occupied, now, "all"), "move");
  assert.equal(nextMachineStatus(occupied, now, "washer"), "grace");
  const running = occupied.map((m) => ({
    ...m,
    endsAt: Math.max(now + MINUTE, m.endsAt!),
  }));
  assert.equal(nextMachineStatus(running, now, "dryer"), "running");
  const tier = nextMachineStatus(occupied, now, "washer");
  const results = selectMachines(
    occupied,
    now,
    { kind: "washer", statuses: [tier] },
    "soonest",
  );
  assert.ok(results.length > 0);
  assert.ok(
    results.every((m) => m.kind === "washer" && statusOf(m, now) === "grace"),
  );
});

import { loadRecord, restoreHistory, dayKey } from "./load-history";
test("load history survives collection, repeat cycles and legacy storage", () => {
  const data = freshLaundry(now);
  assert.equal(data.history.length, 3);
  const record = data.history[0];
  assert.equal(record.endsAt - record.startedAt, 30 * MINUTE);
  const collected = { ...record, collectedAt: record.endsAt + MINUTE };
  data.history = [collected];
  data.machines = data.machines.map((m) =>
    m.id === "D03" ? { ...m, owner: "neighbor" } : m,
  );
  data.machines = data.machines.map((m) =>
    m.id === record.machineId ? { ...m, endsAt: null, owner: undefined } : m,
  );
  const restored = restoreLaundry(JSON.stringify(data), now + 10 * MINUTE);
  assert.deepEqual(restored.history, [collected]);
  const next = {
    ...restored.machines.find((m) => m.id === record.machineId)!,
    owner: "you" as const,
    endsAt: now + 60 * MINUTE,
  };
  assert.equal(
    restoreHistory(
      restored.history,
      restored.machines.map((m) => (m.id === next.id ? next : m)),
    ).length,
    2,
  );
  assert.equal(loadRecord({ ...next, owner: "neighbor" }), null);
  const legacy = JSON.parse(JSON.stringify(freshLaundry(now)));
  delete legacy.history;
  assert.equal(restoreLaundry(JSON.stringify(legacy), now).history.length, 2);
});
test("invalid history is ignored without losing loads and calendar keys use local dates", () => {
  const data = freshLaundry(now);
  const restored = restoreLaundry(
    JSON.stringify({ ...data, history: [{ id: "bad", endsAt: "oops" }] }),
    now,
  );
  assert.deepEqual(
    restored.machines,
    JSON.parse(JSON.stringify(data.machines)),
  );
  assert.equal(restored.history.length, 2);
  const date = new Date(2026, 0, 2, 0, 5);
  assert.equal(dayKey(date.getTime()), "2026-01-02");
  assert.equal(
    restoreHistory([...data.history, ...data.history], data.machines).length,
    3,
  );
});

test("notification read states migrate and persist independently", () => {
  const data = freshLaundry(now);
  data.lastRead = now;
  data.activity = [
    {
      id: "old",
      text: "Old notification",
      time: now - 1,
      recipient: "you",
      category: "loads",
    },
    {
      id: "new",
      text: "New notification",
      time: now + 1,
      recipient: "you",
      category: "loads",
    },
  ];
  const migrated = restoreLaundry(JSON.stringify(data), now);
  assert.equal(migrated.activity[0].readAt, now);
  assert.equal(migrated.activity[1].readAt, undefined);
  migrated.activity[1].readAt = now + 10;
  assert.equal(
    restoreLaundry(JSON.stringify(migrated), now + 10).activity[1].readAt,
    now + 10,
  );
});

test("fresh demo seeds unread cubby movement and a matching history entry", () => {
  const data = freshLaundry(now);
  assert.equal(
    data.activity.filter(
      (event) => event.recipient === "you" && event.readAt === undefined,
    ).length,
    2,
  );
  const moved = data.activity.find((event) => event.location === "Cubby B")!;
  assert.equal(moved.machineId, "W05");
  assert.equal(
    data.machines.find((machine) => machine.id === moved.machineId)!.endsAt,
    null,
  );
  assert.equal(
    data.history.find((record) => record.machineId === "W05")!.movedTo,
    "Cubby B",
  );
  assert.equal(
    restoreLaundry(JSON.stringify(data), now).activity.filter(
      (event) => event.readAt === undefined,
    ).length,
    2,
  );
});

test("reset demo includes your running washer, one-minute pickup dryer, and cubby load", () => {
  const data = freshLaundry(now);
  const washer = data.machines.find((m) => m.id === "W03")!;
  const dryer = data.machines.find((m) => m.id === "D03")!;
  assert.equal(washer.owner, "you");
  assert.equal(statusOf(washer, now), "running");
  assert.equal(dryer.owner, "you");
  assert.equal(statusOf(dryer, now), "grace");
  assert.equal(dryer.endsAt! + GRACE - now, MINUTE);
  assert.equal(
    data.history.filter(
      (r) => r.movedTo === "Cubby B" && r.collectedAt === undefined,
    ).length,
    1,
  );
});

import { scenarioLaundry } from "./scenarios";
test("all four scenarios meet their occupancy and ownership promises", () => {
  const first = scenarioLaundry(1, now);
  assert.ok(first.machines.every((m) => statusOf(m, now) !== "running"));
  assert.ok(first.machines.some((m) => m.endsAt === null));
  assert.equal(first.machines.filter((m) => m.owner === "you").length, 0);
  assert.equal(first.history.length, 0);
  const second = scenarioLaundry(2, now);
  assert.equal(second.machines.filter((m) => m.owner === "you").length, 0);
  assert.equal(second.history.length, 0);
  assert.ok(second.watches.every((w) => w.category === "watching"));
  assert.ok(
    second.machines.every((m) =>
      ["grace", "running"].includes(statusOf(m, now)),
    ),
  );
  const shortWindow = second.machines.find((m) => m.id === "W04")!;
  assert.equal(shortWindow.endsAt! + GRACE - now, 15000);
  assert.equal(statusOf(shortWindow, now + 15000), "move");
  assert.ok(
    scenarioLaundry(3, now).machines.some(
      (m) => m.owner === "you" && statusOf(m, now) === "grace",
    ),
  );
  const fourth = scenarioLaundry(4, now);
  assert.ok(
    fourth.history.some(
      (r) => r.movedTo === "Cubby B" && r.collectedAt === undefined,
    ),
  );
  for (const scenario of [1, 2, 3, 4] as const) {
    const data = scenarioLaundry(scenario, now);
    assert.deepEqual(
      restoreLaundry(JSON.stringify(data), now),
      JSON.parse(JSON.stringify(data)),
    );
  }
});
